/**
 * TypeScript types matching the Python GatewayProcessRequest / GatewayProcessResponse
 * contracts in Dummy_Agent/api/contracts.py and Mislink_Agent/api/contracts.py.
 *
 * These MUST stay in sync with contracts/api-contract.md.
 */

// ---- Requests ----

export interface GatewayProcessRequest {
  workflow: "dummy" | "mislink";
  ticket_id: string;
  source: string;
  thread_id?: string;
  user_id?: string;
  /**
   * Optional metadata passed to the pipeline.
   *
   * Known keys:
   * - `memory`: MemoryContext from src/lib/memory/context.ts
   *   (past_runs, has_history). Backends treat this as supplementary;
   *   their own JSONL memory is the primary cross-session store.
   *
   * Backends handle this being empty or absent (backward compatible).
   */
  context?: Record<string, unknown>;
}

export interface GatewayDecisionRequest {
  workflow: "dummy" | "mislink";
  run_id: string;
  decision: "approve" | "reject" | "modify";
  comment?: string;
  user_id?: string;
  thread_id?: string;
}

// ---- Success Responses ----

export interface GatewayProcessResponse {
  ok: true;
  workflow: string;
  run_id: string;
  title: string;
  summary: string;
  status: "pending_review" | "completed" | "failed";
  confidence: number | null;
  details: Record<string, unknown>;
  actions: string[];
}

export interface GatewayDecisionResponse {
  ok: true;
  workflow: string;
  run_id: string;
  status: string;
  message: string;
  details: Record<string, unknown>;
}

export interface GatewayRunResponse {
  ok: true;
  workflow: string;
  run_id: string;
  status: string;
  summary: string;
  details: Record<string, unknown>;
}

// ---- Error Response ----

export interface GatewayErrorResponse {
  ok: false;
  error: string;
  message: string;
}

// ---- Union helper ----

export type GatewayResult<T> = T | GatewayErrorResponse;
