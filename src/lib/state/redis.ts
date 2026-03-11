/**
 * Redis state adapter for staging/production.
 *
 * Requires `ioredis` to be installed: npm install ioredis
 * Entries expire after 7 days.
 */

import type { RunContext, StateAdapter } from "./adapter";

const PREFIX = "service-b:run:";
const TICKET_INDEX_PREFIX = "service-b:ticket:";
const TTL_SECONDS = 86400 * 7; // 7 days

export class RedisStateAdapter implements StateAdapter {
  private client: any;

  constructor(redisUrl: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");
    this.client = new Redis(redisUrl);
  }

  async save(runId: string, context: RunContext): Promise<void> {
    const pipeline = this.client.pipeline();
    pipeline.set(PREFIX + runId, JSON.stringify(context), "EX", TTL_SECONDS);
    // Secondary index: sorted set of run_ids per ticket, scored by created_at
    const ticketKey = TICKET_INDEX_PREFIX + context.ticket_id;
    pipeline.zadd(ticketKey, context.created_at, runId);
    pipeline.expire(ticketKey, TTL_SECONDS);
    await pipeline.exec();
  }

  async get(runId: string): Promise<RunContext | null> {
    const data = await this.client.get(PREFIX + runId);
    return data ? JSON.parse(data) : null;
  }

  async delete(runId: string): Promise<void> {
    // Remove from ticket index if context is still available
    const ctx = await this.get(runId);
    if (ctx) {
      await this.client.zrem(TICKET_INDEX_PREFIX + ctx.ticket_id, runId);
    }
    await this.client.del(PREFIX + runId);
  }

  async listByTicketId(ticketId: string, limit = 5): Promise<RunContext[]> {
    // Get most recent run_ids from the sorted set (highest score = newest)
    const runIds: string[] = await this.client.zrevrange(
      TICKET_INDEX_PREFIX + ticketId,
      0,
      limit - 1,
    );
    if (!runIds.length) return [];

    const pipeline = this.client.pipeline();
    for (const id of runIds) {
      pipeline.get(PREFIX + id);
    }
    const results = await pipeline.exec();
    const contexts: RunContext[] = [];
    for (const [err, data] of results) {
      if (!err && data) {
        contexts.push(JSON.parse(data as string));
      }
    }
    return contexts;
  }
}
