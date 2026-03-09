/**
 * Slack Block Kit builders for approval cards and decision results.
 */

import type { GatewayProcessResponse } from "../contracts/gateway";

export interface ActionPayload {
  workflow: string;
  run_id: string;
  ticket_id: string;
}

/** Build an approval card with Approve / Reject / Modify buttons. */
export function buildApprovalCard(
  result: GatewayProcessResponse,
  ticketId: string,
): any[] {
  const confidenceStr =
    result.confidence != null
      ? ` (${Math.round(result.confidence * 100)}% confidence)`
      : "";

  const actionPayload: ActionPayload = {
    workflow: result.workflow,
    run_id: result.run_id,
    ticket_id: ticketId,
  };
  const encodedPayload = JSON.stringify(actionPayload);

  const details = result.details as Record<string, string | undefined>;
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: result.title },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: result.summary + confidenceStr },
    },
  ];

  // Details fields — category, severity, team, etc.
  const fields: any[] = [];
  if (details.category) fields.push({ type: "mrkdwn", text: `*Category:* \`${details.category}\`` });
  if (details.severity) fields.push({ type: "mrkdwn", text: `*Severity:* ${details.severity}` });
  if (details.target_team) fields.push({ type: "mrkdwn", text: `*Team:* ${details.target_team}` });
  fields.push({ type: "mrkdwn", text: `*Status:* ${result.status}` });
  if (fields.length > 0) {
    blocks.push({ type: "section", fields });
  }

  // Root cause (mislink workflow)
  if (details.root_cause_summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Root Cause:* ${details.root_cause_summary}` },
    });
  }

  blocks.push({ type: "divider" });

  // Run ID context
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Run ID: \`${result.run_id}\` | Workflow: \`${result.workflow}\``,
      },
    ],
  });

  // Action buttons
  const elements: any[] = [];
  if (result.actions.includes("approve")) {
    elements.push({
      type: "button",
      text: { type: "plain_text", text: "Approve" },
      style: "primary",
      action_id: "approve_action",
      value: encodedPayload,
    });
  }
  if (result.actions.includes("reject")) {
    elements.push({
      type: "button",
      text: { type: "plain_text", text: "Reject" },
      style: "danger",
      action_id: "reject_action",
      value: encodedPayload,
    });
  }
  if (result.actions.includes("modify")) {
    elements.push({
      type: "button",
      text: { type: "plain_text", text: "Modify" },
      action_id: "modify_action",
      value: encodedPayload,
    });
  }
  if (elements.length > 0) {
    blocks.push({
      type: "actions",
      block_id: `decision_${result.run_id}`,
      elements,
    });
  }

  return blocks;
}

/** Build a decision result message for a Slack thread. */
export function buildDecisionResult(
  decision: string,
  runId: string,
  message: string,
  status: string,
  userId: string,
): any[] {
  const emoji: Record<string, string> = {
    approved: ":white_check_mark:",
    rejected: ":x:",
    modified: ":pencil2:",
  };

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji[status] || ":grey_question:"} *Decision: ${decision}* by <@${userId}>\n${message}`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Run ID: \`${runId}\`` }],
    },
  ];
}

/** Build a visible error card. */
export function buildErrorCard(
  error: string,
  message: string,
): any[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Error:* \`${error}\`\n${message}`,
      },
    },
  ];
}
