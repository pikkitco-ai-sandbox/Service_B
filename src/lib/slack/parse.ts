/**
 * Parse Slack events and commands into structured objects.
 */

import { extractTicketId, inferWorkflow, type Workflow } from "../backend/router";

export interface ParsedCommand {
  command: string;
  text: string;
  ticket_id: string | null;
  user_id: string;
  channel_id: string;
  thread_ts?: string;
  response_url: string;
}

export interface ParsedMention {
  text: string;
  ticket_id: string | null;
  workflow: Workflow;
  user_id: string;
  channel_id: string;
  thread_ts: string;
  event_ts: string;
}

/** Parse a URL-encoded slash command body. */
export function parseSlashCommand(params: URLSearchParams): ParsedCommand {
  const command = params.get("command") || "";
  const text = params.get("text") || "";
  return {
    command,
    text,
    ticket_id: extractTicketId(text),
    user_id: params.get("user_id") || "",
    channel_id: params.get("channel_id") || "",
    thread_ts: params.get("thread_ts") || undefined,
    response_url: params.get("response_url") || "",
  };
}

/** Parse an app_mention event payload. Strips the bot mention from text. */
export function parseMention(event: Record<string, unknown>): ParsedMention {
  const rawText = String(event.text || "");
  // Strip <@UBOTID> mention prefix
  const text = rawText.replace(/<@[A-Z0-9]+>/g, "").trim();

  return {
    text,
    ticket_id: extractTicketId(text),
    workflow: inferWorkflow(text),
    user_id: String(event.user || ""),
    channel_id: String(event.channel || ""),
    thread_ts: String(event.thread_ts || event.ts || ""),
    event_ts: String(event.ts || ""),
  };
}
