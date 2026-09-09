import { describe, expect, it } from "vitest";

import { isAgentCardUrl, parsePublicHttpsUrl } from "../safe-provider-url";

describe("safe provider URLs", () => {
  it("accepts public HTTPS endpoints", () => {
    const url = parsePublicHttpsUrl("https://agent.example/.well-known/agent-card.json");
    expect(url?.protocol).toBe("https:");
    expect(isAgentCardUrl(url!)).toBe(true);
  });

  it.each([
    "http://agent.example/.well-known/agent-card.json",
    "https://localhost/.well-known/agent-card.json",
    "https://127.0.0.1/.well-known/agent-card.json",
    "https://169.254.169.254/latest/meta-data",
    "https://user:password@agent.example/.well-known/agent-card.json",
  ])("rejects unsafe endpoint %s", (value) => {
    expect(parsePublicHttpsUrl(value)).toBeNull();
  });

  it("requires the exact agent-card path", () => {
    const url = parsePublicHttpsUrl("https://agent.example/agent-card.json");
    expect(url).not.toBeNull();
    expect(isAgentCardUrl(url!)).toBe(false);
  });
});
