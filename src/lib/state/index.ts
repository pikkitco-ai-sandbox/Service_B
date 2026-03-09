/**
 * State adapter factory.
 *
 * Uses in-memory adapter by default. Redis adapter is available in
 * src/lib/state/redis.ts — install ioredis and update this factory
 * to enable it in production.
 */

import { logWarn } from "../log";
import type { StateAdapter } from "./adapter";
import { MemoryStateAdapter } from "./memory";

let _adapter: StateAdapter | null = null;

export function getStateAdapter(): StateAdapter {
  if (!_adapter) {
    _adapter = new MemoryStateAdapter();
    if (process.env.CHAT_BACKEND_MODE === "live" && !process.env.REDIS_URL) {
      logWarn("memory_adapter_in_live_mode", {
        source: "backend",
        mode: "live",
      });
    }
  }
  return _adapter;
}

export type { StateAdapter, RunContext } from "./adapter";
