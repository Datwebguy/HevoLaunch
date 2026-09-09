import type { ScanAgent } from "@/lib/8004scan";

/**
 * HevoLaunch listing bar — not 8004scan's full index.
 *
 * BSC mainnet has hundreds of thousands of ERC-8004 tokens. Most are
 * airdrop-farmed: "Agent #338368", "qhbwown", "rhfdddddddfffffffffffff",
 * no endpoint, no description. Trust8004 indexes all of them. We do not.
 *
 * A listing must be mainnet, named like a product, described, and reachable.
 */

export type RejectReason =
  | "not-mainnet"
  | "placeholder-name"
  | "gibberish-name"
  | "thin-description"
  | "no-endpoint"
  | "unhealthy-endpoint"
  | "test-or-demo";

export interface QualifyResult {
  ok: boolean;
  reasons: RejectReason[];
}

const MAINNET_CHAIN_ID = 56;

const PLACEHOLDER_NAME = /^(agent\s*#?\d+|untitled|test|asdf|qwerty)$/i;
const RANDOM_DOT_AGENT = /^[a-z0-9]{5,24}\.agent$/i;
const REPEATED_CHAR = /(.)\1{5,}/i;

function vowelRatio(s: string): number {
  const letters = s.replace(/[^a-z]/gi, "");
  if (letters.length < 6) return 1;
  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  return vowels / letters.length;
}

function looksGibberishName(name: string): boolean {
  const t = name.trim();
  if (PLACEHOLDER_NAME.test(t)) return true;
  if (REPEATED_CHAR.test(t)) return true;
  if (RANDOM_DOT_AGENT.test(t) && vowelRatio(t) < 0.22) return true;
  if (vowelRatio(t) < 0.12) return true;
  return false;
}

function thinDescription(description: string | null | undefined): boolean {
  const t = (description ?? "").trim();
  if (t.length < 32) return true;
  if (REPEATED_CHAR.test(t)) return true;
  if (vowelRatio(t) < 0.12) return true;
  return false;
}

function hasReachableSurface(agent: ScanAgent): boolean {
  if (agent.a2a_endpoint) return true;
  if (agent.supported_protocols?.some((p) => /^(a2a|mcp)$/i.test(p))) return true;
  return false;
}

export function qualifyScanAgent(agent: ScanAgent): QualifyResult {
  const reasons: RejectReason[] = [];

  if (agent.chain_id !== MAINNET_CHAIN_ID || agent.is_testnet) {
    reasons.push("not-mainnet");
  }
  const name = (agent.name ?? "").trim();
  const searchableText = `${name} ${agent.description ?? ""}`.toLowerCase();
  if (/\b(test|demo|mock|dummy|fixture)\b|not for production/.test(searchableText)) {
    reasons.push("test-or-demo");
  }
  if (!name || PLACEHOLDER_NAME.test(name) || /^agent\s*#\d+$/i.test(name)) {
    reasons.push("placeholder-name");
  } else if (looksGibberishName(name)) {
    reasons.push("gibberish-name");
  }
  if (thinDescription(agent.description)) {
    reasons.push("thin-description");
  }
  if (!hasReachableSurface(agent)) {
    reasons.push("no-endpoint");
  }
  const health = agent.health_status?.overall_status;
  if (health === "unhealthy" || health === "degraded") {
    reasons.push("unhealthy-endpoint");
  }

  return { ok: reasons.length === 0, reasons };
}

export function filterQualifiedAgents(agents: ScanAgent[]): {
  qualified: ScanAgent[];
  rejected: number;
  scanned: number;
} {
  const qualified: ScanAgent[] = [];
  for (const agent of agents) {
    if (qualifyScanAgent(agent).ok) qualified.push(agent);
  }
  return {
    qualified,
    rejected: agents.length - qualified.length,
    scanned: agents.length,
  };
}
