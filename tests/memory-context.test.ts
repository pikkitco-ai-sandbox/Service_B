import { describe, it, expect } from "vitest";
import { MemoryStateAdapter } from "@/lib/state/memory";
import { loadMemoryContext } from "@/lib/memory/context";
import type { RunContext } from "@/lib/state/adapter";

function makeRunContext(overrides: Partial<RunContext> = {}): RunContext {
  return {
    run_id: "ENG-500_abc123",
    workflow: "mislink",
    ticket_id: "ENG-500",
    thread_ts: "1234567890.123456",
    channel_id: "C123",
    user_id: "U123",
    status: "pending_review",
    created_at: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// MemoryStateAdapter.listByTicketId
// ---------------------------------------------------------------------------

describe("MemoryStateAdapter.listByTicketId", () => {
  it("returns empty array when no runs exist", async () => {
    const adapter = new MemoryStateAdapter();
    const result = await adapter.listByTicketId("ENG-999");
    expect(result).toEqual([]);
  });

  it("returns matching runs for a ticket", async () => {
    const adapter = new MemoryStateAdapter();
    await adapter.save("run1", makeRunContext({ run_id: "run1", ticket_id: "ENG-500" }));
    await adapter.save("run2", makeRunContext({ run_id: "run2", ticket_id: "ENG-500" }));
    await adapter.save("run3", makeRunContext({ run_id: "run3", ticket_id: "ENG-600" }));

    const result = await adapter.listByTicketId("ENG-500");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.ticket_id === "ENG-500")).toBe(true);
  });

  it("returns newest first", async () => {
    const adapter = new MemoryStateAdapter();
    await adapter.save("old", makeRunContext({ run_id: "old", created_at: 1000 }));
    await adapter.save("new", makeRunContext({ run_id: "new", created_at: 2000 }));

    const result = await adapter.listByTicketId("ENG-500");
    expect(result[0].run_id).toBe("new");
    expect(result[1].run_id).toBe("old");
  });

  it("respects the limit parameter", async () => {
    const adapter = new MemoryStateAdapter();
    for (let i = 0; i < 10; i++) {
      await adapter.save(`run${i}`, makeRunContext({ run_id: `run${i}`, created_at: i }));
    }

    const result = await adapter.listByTicketId("ENG-500", 3);
    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// loadMemoryContext
// ---------------------------------------------------------------------------

describe("loadMemoryContext", () => {
  it("returns empty context when no history exists", async () => {
    const adapter = new MemoryStateAdapter();
    const ctx = await loadMemoryContext("ENG-999", adapter);
    expect(ctx.has_history).toBe(false);
    expect(ctx.past_runs).toEqual([]);
  });

  it("returns context with run summaries", async () => {
    const adapter = new MemoryStateAdapter();
    await adapter.save("run1", makeRunContext({ run_id: "run1" }));

    const ctx = await loadMemoryContext("ENG-500", adapter);
    expect(ctx.has_history).toBe(true);
    expect(ctx.past_runs).toHaveLength(1);
    expect(ctx.past_runs[0].run_id).toBe("run1");
    expect(ctx.past_runs[0].workflow).toBe("mislink");
    expect(ctx.past_runs[0].status).toBe("pending_review");
  });

  it("strips non-summary fields from run contexts", async () => {
    const adapter = new MemoryStateAdapter();
    await adapter.save("run1", makeRunContext({ run_id: "run1" }));

    const ctx = await loadMemoryContext("ENG-500", adapter);
    const summary = ctx.past_runs[0];
    // RunSummary should only have run_id, workflow, status, created_at
    expect(Object.keys(summary).sort()).toEqual(
      ["created_at", "run_id", "status", "workflow"].sort(),
    );
  });

  it("degrades gracefully on adapter failure", async () => {
    const broken: any = {
      listByTicketId: () => {
        throw new Error("connection refused");
      },
    };
    const ctx = await loadMemoryContext("ENG-500", broken);
    expect(ctx.has_history).toBe(false);
    expect(ctx.past_runs).toEqual([]);
  });

  it("respects the limit parameter", async () => {
    const adapter = new MemoryStateAdapter();
    for (let i = 0; i < 10; i++) {
      await adapter.save(`run${i}`, makeRunContext({ run_id: `run${i}`, created_at: i }));
    }

    const ctx = await loadMemoryContext("ENG-500", adapter, 2);
    expect(ctx.past_runs).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Happy-path: memory context → gateway request shape
// ---------------------------------------------------------------------------

describe("Memory context to gateway request integration", () => {
  it("builds a valid context.memory for GatewayProcessRequest", async () => {
    const adapter = new MemoryStateAdapter();
    await adapter.save(
      "run1",
      makeRunContext({ run_id: "run1", status: "pending_review", created_at: 1710000000 }),
    );
    await adapter.save(
      "run2",
      makeRunContext({ run_id: "run2", status: "completed", created_at: 1710001000 }),
    );

    const ctx = await loadMemoryContext("ENG-500", adapter);

    // Simulate what Service_B route handler does: embed in request context
    const gatewayContext: Record<string, unknown> = { memory: ctx };

    // Verify shape matches api-contract.md specification
    const memory = gatewayContext.memory as {
      past_runs: Array<{ run_id: string; workflow: string; status: string; created_at: number }>;
      has_history: boolean;
    };

    expect(memory.has_history).toBe(true);
    expect(memory.past_runs.length).toBe(2);

    for (const run of memory.past_runs) {
      expect(typeof run.run_id).toBe("string");
      expect(typeof run.workflow).toBe("string");
      expect(typeof run.status).toBe("string");
      expect(typeof run.created_at).toBe("number");
      // Verify only the 4 contract fields are present (no extras like ticket_id, channel_id)
      expect(Object.keys(run).sort()).toEqual(["created_at", "run_id", "status", "workflow"]);
    }
  });

  it("builds empty context for first-time ticket", async () => {
    const adapter = new MemoryStateAdapter();
    const ctx = await loadMemoryContext("NEVER-SEEN", adapter);

    const gatewayContext: Record<string, unknown> = { memory: ctx };
    const memory = gatewayContext.memory as { past_runs: unknown[]; has_history: boolean };

    expect(memory.has_history).toBe(false);
    expect(memory.past_runs).toEqual([]);
  });
});
