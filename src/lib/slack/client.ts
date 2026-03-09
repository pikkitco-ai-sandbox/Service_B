/**
 * Slack WebClient singleton.
 *
 * Lazy-initialized on first use. Reads SLACK_BOT_TOKEN from env.
 */

import { WebClient } from "@slack/web-api";

let _client: WebClient | null = null;

export function getSlackClient(): WebClient {
  if (!_client) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error("SLACK_BOT_TOKEN is required");
    }
    _client = new WebClient(token);
  }
  return _client;
}
