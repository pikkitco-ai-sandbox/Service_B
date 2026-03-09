import { describe, it, expect } from "vitest";
import { routeCommand, inferWorkflow, extractTicketId } from "@/lib/backend/router";

describe("routeCommand", () => {
  it("routes /mislink to mislink", () => {
    expect(routeCommand("/mislink")).toBe("mislink");
  });

  it("routes /support to dummy", () => {
    expect(routeCommand("/support")).toBe("dummy");
  });

  it("defaults unknown commands to dummy", () => {
    expect(routeCommand("/unknown")).toBe("dummy");
  });
});

describe("inferWorkflow", () => {
  it("infers mislink from 'mislink' keyword", () => {
    expect(inferWorkflow("this is a mislink")).toBe("mislink");
  });

  it("infers mislink from 'mismatch' keyword", () => {
    expect(inferWorkflow("player identity mismatch found")).toBe("mislink");
  });

  it("infers mislink from 'wrong player' keyword", () => {
    expect(inferWorkflow("ENG-100 wrong player linked")).toBe("mislink");
  });

  it("defaults to dummy for generic text", () => {
    expect(inferWorkflow("please check this ticket")).toBe("dummy");
  });

  it("is case insensitive", () => {
    expect(inferWorkflow("This is a MISLINK")).toBe("mislink");
  });
});

describe("extractTicketId", () => {
  it("extracts ENG-12345", () => {
    expect(extractTicketId("check ENG-12345 please")).toBe("ENG-12345");
  });

  it("extracts SUPPORT-100", () => {
    expect(extractTicketId("SUPPORT-100 is broken")).toBe("SUPPORT-100");
  });

  it("extracts first match when multiple present", () => {
    expect(extractTicketId("ENG-111 and ENG-222")).toBe("ENG-111");
  });

  it("returns null when no ticket ID", () => {
    expect(extractTicketId("no ticket here")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractTicketId("")).toBeNull();
  });
});
