/**
 * Slack Events API handler.
 *
 * Handles:
 *   - URL verification challenge (required by Slack)
 *   - app_mention events -> parse, call backend, post approval card
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/verify";
import { parseMention } from "@/lib/slack/parse";
import { processTicket } from "@/lib/backend/client";
import { getSlackClient } from "@/lib/slack/client";
import { buildApprovalCard, buildErrorCard } from "@/lib/slack/blocks";
import { getStateAdapter } from "@/lib/state";
import type { GatewayProcessResponse, GatewayErrorResponse } from "@/lib/contracts/gateway";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";
  const signingSecret = process.env.SLACK_SIGNING_SECRET || "";

  if (signingSecret && !verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Feature gate — when disabled, acknowledge but do nothing
  if (process.env.NEW_CHAT_LAYER_ENABLED !== "true") {
    return NextResponse.json({ ok: true });
  }

  // Event callback
  if (body.type === "event_callback" && body.event?.type === "app_mention") {
    // Respond immediately, process async
    handleMention(body.event).catch(console.error);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleMention(event: Record<string, unknown>) {
  const parsed = parseMention(event);
  const slack = getSlackClient();

  if (!parsed.ticket_id) {
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      text: "Please include a ticket ID (e.g., `ENG-12345`) in your message.",
    });
    return;
  }

  // Mock mode
  if (process.env.CHAT_BACKEND_MODE === "mock") {
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      text: `[Mock] Would process \`${parsed.ticket_id}\` via \`${parsed.workflow}\` workflow.`,
    });
    return;
  }

  const result = await processTicket({
    workflow: parsed.workflow,
    ticket_id: parsed.ticket_id,
    source: "slack",
    thread_id: parsed.thread_ts,
    user_id: parsed.user_id,
  });

  if (!result.ok) {
    const err = result as GatewayErrorResponse;
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      thread_ts: parsed.thread_ts,
      blocks: buildErrorCard(err.error, err.message),
      text: `Error: ${err.message}`,
    });
    return;
  }

  const success = result as GatewayProcessResponse;

  // Save context so action handlers can route decisions
  const state = getStateAdapter();
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
