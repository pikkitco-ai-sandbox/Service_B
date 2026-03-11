/**
 * Slack Events API handler.
 *
 * Handles:
 *   - URL verification challenge (required by Slack)
 *   - app_mention events -> parse, call backend, post approval card
 */

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { verifySlackRequest } from "@/lib/slack/verify";
import { parseMention } from "@/lib/slack/parse";
import { processTicket } from "@/lib/backend/client";
import { getSlackClient } from "@/lib/slack/client";
import { buildApprovalCard, buildErrorCard } from "@/lib/slack/blocks";
import { getStateAdapter } from "@/lib/state";
import { loadMemoryContext } from "@/lib/memory/context";
import { logInfo, logWarn, logError } from "@/lib/log";
import type { GatewayProcessResponse, GatewayErrorResponse } from "@/lib/contracts/gateway";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";
  const signingSecret = process.env.SLACK_SIGNING_SECRET || "";

  if (!signingSecret) {
    logWarn("signature_skipped", { source: "event" });
  } else if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    logWarn("signature_failed", { source: "event" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    logError("invalid_json", { source: "event" });
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // URL verification challenge
  if (body.type === "url_verification") {
    logInfo("url_verification", { source: "event" });
    return NextResponse.json({ challenge: body.challenge });
  }

  // Feature gate — when disabled, acknowledge but do nothing
  if (process.env.NEW_CHAT_LAYER_ENABLED !== "true") {
    logInfo("gate_disabled", { source: "event" });
    return NextResponse.json({ ok: true });
  }

  // Event callback
  const event = body.event as Record<string, unknown> | undefined;
  if (body.type === "event_callback" && event?.type === "app_mention") {
    // Respond immediately, keep function alive for async work
    waitUntil(
      handleMention(event).catch((err) =>
        logError("mention_handler_failed", { source: "event", error: String(err) }),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleMention(event: Record<string, unknown>) {
  const parsed = parseMention(event);
  const mode = process.env.CHAT_BACKEND_MODE || "mock";
  const slack = getSlackClient();

  logInfo("mention_received", {
    source: "event",
    workflow: parsed.workflow,
    ticket_id: parsed.ticket_id || undefined,
    mode,
  });

  if (!parsed.ticket_id) {
    logWarn("missing_ticket_id", { source: "event" });
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      text: "Please include a ticket ID (e.g., `ENG-12345`) in your message.",
    });
    return;
  }

  // Mock mode
  if (mode === "mock") {
    logInfo("mock_response", { source: "event", workflow: parsed.workflow, ticket_id: parsed.ticket_id });
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      text: `[Mock] Would process \`${parsed.ticket_id}\` via \`${parsed.workflow}\` workflow.`,
    });
    return;
  }

  // Load memory context (recent runs for this ticket)
  const state = getStateAdapter();
  const memoryCtx = await loadMemoryContext(parsed.ticket_id, state);

  const result = await processTicket({
    workflow: parsed.workflow,
    ticket_id: parsed.ticket_id,
    source: "slack",
    thread_id: parsed.thread_ts,
    user_id: parsed.user_id,
    context: memoryCtx.has_history ? { memory: memoryCtx } : undefined,
  });

  if (!result.ok) {
    const err = result as GatewayErrorResponse;
    logError("process_failed", { source: "event", workflow: parsed.workflow, ticket_id: parsed.ticket_id, error: err.error });
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      blocks: buildErrorCard(err.error, err.message),
      text: `Error: ${err.message}`,
    });
    return;
  }

  const success = result as GatewayProcessResponse;
  logInfo("process_success", {
    source: "event",
    workflow: success.workflow,
    ticket_id: parsed.ticket_id,
    run_id: success.run_id,
  });

  // Save context so action handlers can route decisions
  await state.save(success.run_id, {
    run_id: success.run_id,
    workflow: success.workflow,
    ticket_id: parsed.ticket_id,
    thread_ts: parsed.thread_ts,
    channel_id: parsed.channel_id,
    user_id: parsed.user_id,
    status: success.status,
    created_at: Date.now(),
  });

  await slack.chat.postMessage({
    channel: parsed.channel_id,
    thread_ts: parsed.thread_ts,
    blocks: buildApprovalCard(success, parsed.ticket_id),
    text: `${success.title} — ${success.summary}`,
  });
}
