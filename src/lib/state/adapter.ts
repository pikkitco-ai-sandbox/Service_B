/**
 * State adapter interface for tracking run context.
 *
 * Service_B is NOT the system of record for ticket state —
 * that lives in the Python backends. This adapter stores just
 * enough context to route action callbacks back to the right
 * backend and Slack thread.
 */

export interface RunContext {
  run_id: string;
  workflow: string;
  ticket_id: string;
  thread_ts: string;
  channel_id: string;
  user_id: string;
  status: string;
  created_at: number;
}

export interface StateAdapter {
  save(runId: string, context: RunContext): Promise<void>;
  get(runId: string): Promise<RunContext | null>;
  delete(runId: string): Promise<void>;
}
