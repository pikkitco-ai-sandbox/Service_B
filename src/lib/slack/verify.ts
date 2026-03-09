/**
 * Slack request signature verification.
 *
 * Verifies the X-Slack-Signature header using HMAC-SHA256.
 * Rejects requests older than 5 minutes to prevent replay attacks.
 */

import crypto from "crypto";

export function verifySlackRequest(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  // Reject stale requests (> 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(sigBasestring);
  const computed = `v0=${hmac.digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}
