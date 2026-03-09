/**
 * Redis state adapter for staging/production.
 *
 * Requires `ioredis` to be installed: npm install ioredis
 * Entries expire after 7 days.
 */

import type { RunContext, StateAdapter } from "./adapter";

const PREFIX = "service-b:run:";
const TTL_SECONDS = 86400 * 7; // 7 days

export class RedisStateAdapter implements StateAdapter {
  private client: any;

  constructor(redisUrl: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");
    this.client = new Redis(redisUrl);
  }

  async save(runId: string, context: RunContext): Promise<void> {
    await this.client.set(PREFIX + runId, JSON.stringify(context), "EX", TTL_SECONDS);
  }

  async get(runId: string): Promise<RunContext | null> {
    const data = await this.client.get(PREFIX + runId);
    return data ? JSON.parse(data) : null;
  }

  async delete(runId: string): Promise<void> {
    await this.client.del(PREFIX + runId);
  }
}
