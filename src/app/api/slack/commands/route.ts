/**
 * Slack Slash Commands handler.
 *
 * Routes:
 *   /mislink <ticket-id>  -> mislink backend
 *   /support <ticket-id>  -> dummy backend
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/verify";
import { parseSlashCommand } from "@/lib/slack/parse";
import { routeCommand } from "@/lib/backend/router";
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

  const params = new URLSearchParams(rawBody);
  const parsed = parseSlashCommand(params);
  const workflow = routeCommand(parsed.command);

  if (!parsed.ticket_id) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: `Please provide a ticket ID. Usage: \`${parsed.command} ENG-12345\``,
    });
  }

  // Acknowledge immediately, process async
  handleCommand(parsed, workflow).catch(console.error);

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

  // Mock mode
  if (process.env.CHAT_BACKEND_MODE === "mock") {
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
    await slack.chat.postMessage({
      channel: parsed.channel_id,
      blocks: buildErrorCard(err.error, err.message),
      text: `Error processing ${ticketId}: ${err.message}`,
    });
    return;
  }

  const success = result as GatewayProcessResponse;

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
