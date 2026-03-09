import { describe, it, expect } from "vitest";
import { buildApprovalCard, buildDecisionResult, buildErrorCard } from "@/lib/slack/blocks";
import type { ActionPayload } from "@/lib/slack/blocks";
import type { GatewayProcessResponse } from "@/lib/contracts/gateway";

describe("ActionPayload round-trip", () => {
  it("encodes and decodes correctly", () => {
    const payload: ActionPayload = {
      workflow: "mislink",
      run_id: "ENG-10423_1234567890",
      ticket_id: "ENG-10423",
    };
    const encoded = JSON.stringify(payload);
    const decoded: ActionPayload = JSON.parse(encoded);
    expect(decoded.workflow).toBe("mislink");
    expect(decoded.run_id).toBe("ENG-10423_1234567890");
    expect(decoded.ticket_id).toBe("ENG-10423");
  });
});

describe("buildApprovalCard", () => {
  const mockResult: GatewayProcessResponse = {
    ok: true,
    workflow: "mislink",
    run_id: "ENG-10423_123",
    title: "Mislink Resolution: ENG-10423",
    summary: "Player identity mismatch detected between source and linked event.",
    status: "pending_review",
    confidence: 0.92,
    details: {
      category: "player_identity_mismatch",
      severity: "high",
      root_cause_summary: "Different player IDs in source and linked records.",
    },
    actions: ["approve", "reject", "modify"],
  };

  it("returns an array of blocks", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("includes a header block with the title", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    const header = blocks.find((b) => b.type === "header");
    expect(header).toBeDefined();
    const text = header?.text as Record<string, string>;
    expect(text.text).toContain("ENG-10423");
  });

  it("includes action buttons", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    const actionsBlock = blocks.find((b) => b.type === "actions");
    expect(actionsBlock).toBeDefined();
    const elements = actionsBlock?.elements as Record<string, unknown>[];
    expect(elements.length).toBe(3);
  });

  it("embeds run_id in button values", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    const actionsBlock = blocks.find((b) => b.type === "actions");
    const elements = actionsBlock?.elements as Record<string, string>[];
    const approveBtn = elements.find((e) => e.action_id === "approve_action");
    const decoded: ActionPayload = JSON.parse(approveBtn?.value || "{}");
    expect(decoded.run_id).toBe("ENG-10423_123");
    expect(decoded.workflow).toBe("mislink");
  });

  it("includes confidence in summary", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    const summaryBlock = blocks.find(
      (b) => b.type === "section" && typeof b.text === "object" && (b.text as Record<string, string>).type === "mrkdwn",
    );
    const text = (summaryBlock?.text as Record<string, string>)?.text || "";
    expect(text).toContain("92%");
  });

  it("includes context block with run_id", () => {
    const blocks = buildApprovalCard(mockResult, "ENG-10423");
    const ctx = blocks.find((b) => b.type === "context");
    expect(ctx).toBeDefined();
    const elements = ctx?.elements as Record<string, string>[];
    expect(elements[0].text).toContain("ENG-10423_123");
  });
});

describe("buildDecisionResult", () => {
  it("includes emoji and user mention", () => {
    const blocks = buildDecisionResult("approve", "RUN-1", "Approved.", "approved", "U123");
    const text = (blocks[0].text as Record<string, string>).text;
    expect(text).toContain(":white_check_mark:");
    expect(text).toContain("<@U123>");
  });

  it("shows run_id in context", () => {
    const blocks = buildDecisionResult("reject", "RUN-2", "Rejected.", "rejected", "U456");
    const ctx = blocks.find((b) => b.type === "context");
    const elements = ctx?.elements as Record<string, string>[];
    expect(elements[0].text).toContain("RUN-2");
  });
});

describe("buildErrorCard", () => {
  it("shows error code and message", () => {
    const blocks = buildErrorCard("not_found", "Ticket not found");
    const text = (blocks[0].text as Record<string, string>).text;
    expect(text).toContain("not_found");
    expect(text).toContain("Ticket not found");
  });
});
