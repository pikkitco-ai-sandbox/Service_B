/**
 * State adapter factory.
 *
 * Uses in-memory adapter by default. Redis adapter is available in
 * src/lib/state/redis.ts — install ioredis and update this factory
 * to enable it in production.
 */

import type { StateAdapter } from "./adapter";
import { MemoryStateAdapter } from "./memory";

let _adapter: StateAdapter | null = null;

export function getStateAdapter(): StateAdapter {
  if (!_adapter) {
    _adapter = new MemoryStateAdapter();
  }
  return _adapter;
}

export type { StateAdapter, RunContext } from "./adapter";
