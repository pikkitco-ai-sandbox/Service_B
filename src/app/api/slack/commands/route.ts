/**
 * Slack Slash Commands handler.
 *
 * Routes:
 *   /mislink <ticket-id>  -> mislink backend
 *   /support <ticket-id>  -> dummy backend
 */

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { verifySlackRequest } from "@/lib/slack/verify";
import { parseSlashCommand } from "@/lib/slack/parse";
import { routeCommand } from "@/lib/backend/router";
import { processTicket } from "@/lib/backend/client";
import { getSlackClient } from "@/lib/slack/client";
import { buildApprovalCard, buildErrorCard } from "@/lib/slack/blocks";
import { getStateAdapter } from "@/lib/state";
import { logInfo, logWarn, logError } from "@/lib/log";
import type { GatewayProcessResponse, GatewayErrorResponse } from "@/lib/contracts/gateway";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";
  const signingSecret = process.env.SLACK_SIGNING_SECRET || "";

  if (!signingSecret) {
    logWarn("signature_skipped", { source: "command" });
  } else if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    logWarn("signature_failed", { source: "command" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Feature gate — when disabled, respond with "not ready"
  if (process.env.NEW_CHAT_LAYER_ENABLED !== "true") {
    logInfo("gate_disabled", { source: "command" });
    return NextResponse.json({
      response_type: "ephemeral",
      text: "This command is not yet active. The new chat layer is being rolled out.",
    });
  }

  const params = new URLSearchParams(rawBody);
  const parsed = parseSlashCommand(params);
  const workflow = routeCommand(parsed.command);
  const mode = process.env.CHAT_BACKEND_MODE || "mock";

  logInfo("command_received", {
    source: "command",
    workflow,
    ticket_id: parsed.ticket_id || undefined,
    action: parsed.command,
    mode,
  });

  if (!parsed.ticket_id) {
    logWarn("missing_ticket_id", { source: "command", action: parsed.command });
    return NextResponse.json({
      response_type: "ephemeral",
      text: `Please provide a ticket ID. Usage: \`${parsed.command} ENG-12345\``,
    });
  }

  // Acknowledge immediately, keep function alive for async work
  waitUntil(
    handleCommand(parsed, workflow).catch((err) =>
      logError("command_handler_failed", { source: "command", error: String(err) }),
    ),
  );

  return NextResponse.json({
    response_type: "ephemeral",
    text: `Processing \`${parsed.ticket_id}\` via \`${workflow}\` workflow...`,
  });
}

async function handleCommand(
  parsed: ReturnType<typeof parseSlashCommand>,
  workflow: "dummy" | "mislink",
) {
  const slack = getSlackClient();
  const ticketId = parsed.ticket_id!;
  const mode = process.env.CHAT_BACKEND_MODE || "mock";

  // Mock mode
  if (mode === "mock") {
    logInfo("mock_response", { source: "command", workflow, ticket_id: ticketId });
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      text: `[Mock] Would process \`${ticketId}\` via \`${workflow}\` workflow.\nCommand: \`${parsed.command} ${parsed.text}\``,
    });
    return;
  }

  const result = await processTicket({
    workflow,
    ticket_id: ticketId,
    source: "slack",
    thread_id: parsed.thread_ts,
    user_id: parsed.user_id,
  });

  if (!result.ok) {
    const err = result as GatewayErrorResponse;
    logError("process_failed", { source: "command", workflow, ticket_id: ticketId, error: err.error });
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      blocks: buildErrorCard(err.error, err.message),
      text: `Error processing ${ticketId}: ${err.message}`,
    });
    return;
  }

  const success = result as GatewayProcessResponse;
  logInfo("process_success", { source: "command", workflow, ticket_id: ticketId, run_id: success.run_id });

  const state = getStateAdapter();
  await state.save(success.run_id, {
    run_id: success.run_id,
    workflow: success.workflow,
    ticket_id: ticketId,
    thread_ts: "",
    channel_id: parsed.channel_id,
    user_id: parsed.user_id,
    status: success.status,
    created_at: Date.now(),
  });

  await slack.chat.postMessage({
    channel: parsed.channel_id,
    blocks: buildApprovalCard(success, ticketId),
    text: `${success.title} — ${success.summary}`,
  });
}
