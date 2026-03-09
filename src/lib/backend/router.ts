/**
 * Workflow routing — determines which backend to call.
 *
 * Routing rules:
 *   /mislink command  -> mislink backend
 *   /support command  -> dummy backend
 *   app_mention       -> keyword inference, default dummy
 */

export type Workflow = "dummy" | "mislink";

const MISLINK_KEYWORDS = [
  "mislink",
  "mismatch",
  "linked incorrectly",
  "wrong player",
  "wrong event",
  "wrong market",
  "wrong outcome",
  "mislinked",
];

/** Route a slash command to the correct workflow. */
export function routeCommand(command: string): Workflow {
  if (command === "/mislink") return "mislink";
  if (command === "/support") return "dummy";
  return "dummy";
}

/** Infer workflow from free text (app_mention body). */
export function inferWorkflow(text: string): Workflow {
  const lower = text.toLowerCase();
  for (const kw of MISLINK_KEYWORDS) {
    if (lower.includes(kw)) return "mislink";
  }
  return "dummy";
}

/** Extract a ticket ID like ENG-12345 from text. Returns null if none found. */
const TICKET_ID_PATTERN = /\b([A-Z]+-\d+)\b/;

export function extractTicketId(text: string): string | null {
  const match = text.match(TICKET_ID_PATTERN);
  return match ? match[1] : null;
}
