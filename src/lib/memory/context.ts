/**
 * Memory context middleware for the gateway.
 *
 * Loads recent run summaries for a ticket from the state adapter and
 * builds a lightweight context object that gets passed through to the
 * Python backends via GatewayProcessRequest.context.
 *
 * This module contains NO pipeline logic — it only loads and forwards
 * context. The Python backends decide how to use it.
 */

import type { RunContext, StateAdapter } from "../state/adapter";
import { logInfo, logWarn } from "../log";

export interface MemoryContext {
  past_runs: RunSummary[];
  has_history: boolean;
}

export interface RunSummary {
  run_id: string;
  workflow: string;
  status: string;
  created_at: number;
}

function toRunSummary(ctx: RunContext): RunSummary {
  return {
    run_id: ctx.run_id,
    workflow: ctx.workflow,
    status: ctx.status,
    created_at: ctx.created_at,
  };
}

/**
 * Load memory context for a ticket from the state adapter.
 *
 * Returns a MemoryContext with recent run summaries (newest first).
 * Never throws — returns empty context on failure.
 */
export async function loadMemoryContext(
  ticketId: string,
  adapter: StateAdapter,
  limit = 5,
): Promise<MemoryContext> {
  try {
    const runs = await adapter.listByTicketId(ticketId, limit);
    if (runs.length > 0) {
      logInfo("memory_context_loaded", {
        source: "backend",
        ticket_id: ticketId,
        past_runs: runs.length,
      });
    }
    return {
      past_runs: runs.map(toRunSummary),
      has_history: runs.length > 0,
    };
  } catch (err) {
    logWarn("memory_context_failed", {
      source: "backend",
      ticket_id: ticketId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { past_runs: [], has_history: false };
  }
}
