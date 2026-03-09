/**
 * In-memory state adapter for local development.
 *
 * State is lost on restart. Use Redis for non-local environments.
 */

import type { RunContext, StateAdapter } from "./adapter";

export class MemoryStateAdapter implements StateAdapter {
  private store = new Map<string, RunContext>();

  async save(runId: string, context: RunContext): Promise<void> {
    this.store.set(runId, context);
  }

  async get(runId: string): Promise<RunContext | null> {
    return this.store.get(runId) ?? null;
  }

  async delete(runId: string): Promise<void> {
    this.store.delete(runId);
  }
}
