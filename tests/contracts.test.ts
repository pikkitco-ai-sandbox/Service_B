import { describe, it, expect } from "vitest";
import type {
  GatewayProcessRequest,
  GatewayProcessResponse,
  GatewayDecisionRequest,
  GatewayDecisionResponse,
  GatewayErrorResponse,
} from "@/lib/contracts/gateway";

describe("Gateway contract types", () => {
  it("validates a well-formed process request", () => {
    const req: GatewayProcessRequest = {
      workflow: "mislink",
      ticket_id: "ENG-10423",
      source: "slack",
      thread_id: "1234567890.123456",
      user_id: "U123",
    };
    expect(req.workflow).toBe("mislink");
    expect(req.ticket_id).toBe("ENG-10423");
  });

  it("validates process request with minimal fields", () => {
    const req: GatewayProcessRequest = {
      workflow: "dummy",
      ticket_id: "SUPPORT-1",
      source: "api",
    };
    expect(req.thread_id).toBeUndefined();
    expect(req.user_id).toBeUndefined();
  });

  it("validates a process response", () => {
    const resp: GatewayProcessResponse = {
      ok: true,
      workflow: "mislink",
      run_id: "ENG-10423_1234567890",
      title: "Mislink Resolution: ENG-10423",
      summary: "Player identity mismatch detected",
      status: "pending_review",
      confidence: 0.92,
      details: { category: "player_identity_mismatch", severity: "high" },
      actions: ["approve", "reject", "modify"],
    };
    expect(resp.ok).toBe(true);
    expect(resp.confidence).toBe(0.92);
    expect(resp.actions).toContain("approve");
  });

  it("validates a decision request", () => {
    const req: GatewayDecisionRequest = {
      workflow: "mislink",
      run_id: "ENG-10423_1234567890",
      decision: "approve",
      comment: "Looks correct",
      user_id: "U123",
    };
    expect(req.decision).toBe("approve");
  });

  it("validates a decision response", () => {
    const resp: GatewayDecisionResponse = {
      ok: true,
      workflow: "mislink",
      run_id: "ENG-10423_1234567890",
      status: "approved",
      message: "Resolution approved and executed.",
      details: { outcome: "success" },
    };
    expect(resp.status).toBe("approved");
  });

  it("validates an error response", () => {
    const err: GatewayErrorResponse = {
      ok: false,
      error: "not_found",
      message: "Ticket ENG-99999 not found",
    };
    expect(err.ok).toBe(false);
    expect(err.error).toBe("not_found");
  });

  it("discriminates success vs error via ok field", () => {
    const success: GatewayProcessResponse = {
      ok: true,
      workflow: "dummy",
      run_id: "SUPPORT-1_123",
      title: "Support Ticket",
      summary: "Bug report",
      status: "completed",
      confidence: null,
      details: {},
      actions: [],
    };
    const error: GatewayErrorResponse = {
      ok: false,
      error: "internal_error",
      message: "Something broke",
    };

    expect(success.ok).toBe(true);
    expect(error.ok).toBe(false);
  });
});
