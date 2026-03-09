/**
 * Structured logger for Service_B.
 *
 * Outputs JSON to stdout so Vercel can index it. Never logs secrets.
 * Each log line includes: source, workflow, mode, and relevant IDs.
 */

type LogLevel = "info" | "warn" | "error";

interface LogFields {
  source: "event" | "command" | "interaction" | "backend" | "health";
  workflow?: string;
  mode?: string;
  ticket_id?: string;
  run_id?: string;
  action?: string;
  backend_url?: string;
  status_code?: number;
  error?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, fields: LogFields) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "service-b",
    ...fields,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function logInfo(message: string, fields: LogFields) {
  log("info", message, fields);
}

export function logWarn(message: string, fields: LogFields) {
  log("warn", message, fields);
}

export function logError(message: string, fields: LogFields) {
  log("error", message, fields);
}
