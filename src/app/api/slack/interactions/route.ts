/**
 * Slack Interactions handler.
 *
 * Handles block_actions payloads from Approve / Reject / Modify buttons.
 * Decodes the ActionPayload from button value, calls the backend decision
 * endpoint, and posts a result to the Slack thread.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/verify";
import { submitDecision } from "@/lib/backend/client";
import { getSlackClient } from "@/lib/slack/client";
import { buildDecisionResult, buildErrorCard } from "@/lib/slack/blocks";
import type { ActionPayload } from "@/lib/slack/blocks";
import { getStateAdapter } from "@/lib/state";
import { logInfo, logWarn, logError } from "@/lib/log";
import type { GatewayDecisionResponse, GatewayErrorResponse } from "@/lib/contracts/gateway";

const ACTION_MAP: Record<string, "approve" | "reject" | "modify"> = {
  approve_action: "approve",
  reject_action: "reject",
  modify_action: "modify",
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";
  const signingSecret = process.env.SLACK_SIGNING_SECRET || "";

  if (signingSecret && !verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    logWarn("signature_failed", { source: "interaction" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Feature gate — when disabled, acknowledge but do nothing
  if (process.env.NEW_CHAT_LAYER_ENABLED !== "true") {
    logInfo("gate_disabled", { source: "interaction" });
    return NextResponse.json({ ok: true });
  }

  // Interaction payloads arrive as URL-encoded `payload` field
  const params = new URLSearchParams(rawBody);
  const payloadStr = params.get("payload");
  if (!payloadStr) {
    return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  }

  const payload = JSON.parse(payloadStr);

  if (payload.type === "block_actions") {
    handleBlockAction(payload).catch((err) =>
      logError("interaction_handler_failed", { source: "interaction", error: String(err) }),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleBlockAction(payload: Record<string, unknown>) {
  const actions = payload.actions as Record<string, unknown>[] | undefined;
  const action = actions?.[0];
  if (!action) return;

  const actionId = String(action.action_id || "");
  const decision = ACTION_MAP[actionId];
  if (!decision) return;

  const actionPayload: ActionPayload = JSON.parse(String(action.value || "{}"));
  const user = payload.user as Record<string, string> | undefined;
  const channel = payload.channel as Record<string, string> | undefined;
  const message = payload.message as Record<string, string> | undefined;

  const userId = user?.id || "";
  const channelId = channel?.id || "";
  const messageTs = message?.ts || "";
  const mode = process.env.CHAT_BACKEND_MODE || "mock";

  logInfo("interaction_received", {
    source: "interaction",
    action: decision,
    workflow: actionPayload.workflow,
    run_id: actionPayload.run_id,
    ticket_id: actionPayload.ticket_id,
    mode,
  });

  const slack = getSlackClient();

  // Mock mode
  if (mode === "mock") {
    const mockStatus = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "modified";
    logInfo("mock_response", { source: "interaction", action: decision, run_id: actionPayload.run_id });
    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      blocks: buildDecisionResult(
        decision,
        actionPayload.run_id,
        `[Mock] Decision "${decision}" recorded for \`${actionPayload.ticket_id}\`.`,
        mockStatus,
        userId,
      ),
      text: `[Mock] ${decision} for ${actionPayload.ticket_id}`,
    });
    return;
  }

  const result = await submitDecision({
    workflow: actionPayload.workflow as "dummy" | "mislink",
    run_id: actionPayload.run_id,
    decision,
    user_id: userId,
    thread_id: messageTs,
  });

  if (!result.ok) {
    const err = result as GatewayErrorResponse;
    logError("decision_failed", {
      source: "interaction",
      action: decision,
      run_id: actionPayload.run_id,
      error: err.error,
    });
    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      blocks: buildErrorCard(err.error, err.message),
      text: `Error: ${err.message}`,
    });
    return;
  }

  const success = result as GatewayDecisionResponse;
  logInfo("decision_success", {
    source: "interaction",
    action: decision,
    workflow: success.workflow,
    run_id: success.run_id,
  });

  // Update local state
  const state = getStateAdapter();
  const ctx = await state.get(actionPayload.run_id);
  if (ctx) {
    ctx.status = success.status;
    await state.save(actionPayload.run_id, ctx);
  }

  await slack.chat.postMessage({
    channel: channelId,
    thread_ts: messageTs,
    blocks: buildDecisionResult(decision, success.run_id, success.message, success.status, userId),
    text: `${decision}: ${success.message}`,
  });
}
