import { describe, expect, it } from "vitest";

import { MAINNET_CHAIN_ID, scanAgentUrl } from "../8004scan";

describe("mainnet boundary", () => {
  it("only generates BSC mainnet explorer URLs", () => {
    expect(MAINNET_CHAIN_ID).toBe(56);
    expect(scanAgentUrl(56, 340502)).toBe("https://8004scan.io/agents/bsc/340502");
  });

  it("rejects testnet and unsupported chain IDs", () => {
    expect(() => scanAgentUrl(97, 340535)).toThrow(/mainnet only/);
    expect(() => scanAgentUrl(31337, 340535)).toThrow(/mainnet only/);
  });
});
