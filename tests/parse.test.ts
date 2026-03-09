import { describe, it, expect } from "vitest";
import { parseSlashCommand, parseMention } from "@/lib/slack/parse";

describe("parseSlashCommand", () => {
  it("parses command with ticket ID", () => {
    const params = new URLSearchParams({
      command: "/mislink",
      text: "ENG-10423",
      user_id: "U123",
      channel_id: "C456",
      response_url: "https://hooks.slack.com/commands/...",
    });
    const result = parseSlashCommand(params);
    expect(result.command).toBe("/mislink");
    expect(result.ticket_id).toBe("ENG-10423");
    expect(result.user_id).toBe("U123");
    expect(result.channel_id).toBe("C456");
  });

  it("returns null ticket_id when text has no ticket", () => {
    const params = new URLSearchParams({
      command: "/support",
      text: "help with something",
      user_id: "U123",
      channel_id: "C456",
      response_url: "https://hooks.slack.com/commands/...",
    });
    expect(parseSlashCommand(params).ticket_id).toBeNull();
  });

  it("handles extra text around ticket ID", () => {
    const params = new URLSearchParams({
      command: "/mislink",
      text: "please check ENG-99 it looks wrong",
      user_id: "U123",
      channel_id: "C456",
      response_url: "",
    });
    expect(parseSlashCommand(params).ticket_id).toBe("ENG-99");
  });
});

describe("parseMention", () => {
  it("strips bot mention from text", () => {
    const event = {
      text: "<@U0BOTID> check ENG-10423",
      user: "U123",
      channel: "C456",
      ts: "1234567890.123456",
    };
    const result = parseMention(event);
    expect(result.text).toBe("check ENG-10423");
    expect(result.ticket_id).toBe("ENG-10423");
  });

  it("infers mislink workflow from keywords", () => {
    const event = {
      text: "<@U0BOTID> this is a mislink for ENG-100",
      user: "U123",
      channel: "C456",
      ts: "1234567890.123456",
    };
    expect(parseMention(event).workflow).toBe("mislink");
  });

  it("defaults to dummy workflow for generic text", () => {
    const event = {
      text: "<@U0BOTID> check ENG-100",
      user: "U123",
      channel: "C456",
      ts: "1234567890.123456",
    };
    expect(parseMention(event).workflow).toBe("dummy");
  });

  it("uses thread_ts when in a thread", () => {
    const event = {
      text: "<@U0BOTID> ENG-100",
      user: "U123",
      channel: "C456",
      ts: "1234567890.123456",
      thread_ts: "1234567880.000000",
    };
    expect(parseMention(event).thread_ts).toBe("1234567880.000000");
  });

  it("falls back to ts when no thread_ts", () => {
    const event = {
      text: "<@U0BOTID> ENG-100",
      user: "U123",
      channel: "C456",
      ts: "1234567890.123456",
    };
    expect(parseMention(event).thread_ts).toBe("1234567890.123456");
  });
});
