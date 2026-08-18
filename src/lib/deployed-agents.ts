import type { Agent, AgentPricing, CategorySlug } from "@/lib/types";

/**
 * Real agents deployed with BNB Agent Studio and registered on 8004scan —
 * fill one in per category once it's live, and it automatically becomes
 * that category's featured agent (see mergeDeployedAgents in
 * mock-agents.ts). Leave a category out and it keeps its curated
 * placeholder as featured — nothing breaks either way.
 *
 * Where to get each value:
 *  - agentIdentityAddress: the wallet address `bag deploy agent` prints /
 *    writes to .studio/wallets (the agent's on-chain identity owner).
 *  - agentId: the numeric token id from the agent's 8004scan page
 *    (https://8004scan.io/agents/56/<tokenId> — or read it back with
 *    `getAgent(56, tokenId)` from lib/8004scan.ts once you have it).
 *
 * Reputation starts at zero and is left that way deliberately — a
 * freshly-deployed agent has no real track record yet, and inventing one
 * for something marked `verified: true` would be exactly the kind of
 * fabrication this project has been avoiding throughout. As the agent
 * accrues real feedback on 8004scan, swap this to a live lookup via
 * `getAgent(56, agentId)` the same way lib/live-agents.ts already does
 * for category pages — deliberately deferred, not forgotten.
 */
export interface DeployedAgentConfig {
  category: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  pricing: AgentPricing;
  agentIdentityAddress: `0x${string}`;
  agentId: number;
}

export const DEPLOYED_AGENTS: DeployedAgentConfig[] = [
  // Example — replace with the real values once deployed:
  // {
  //   category: "rebalancing",
  //   name: "Hevo Rebalance",
  //   tagline: "Keeps your portfolio at target weights, automatically.",
  //   description: "Continuously monitors wallet composition against a target allocation and executes minimal-slippage trades on PancakeSwap to bring it back in line.",
  //   capabilities: ["Target-weight allocation", "Drift-triggered execution", "PancakeSwap routing"],
  //   pricing: { model: "subscription", amount: 25, currency: "USDC", cadence: "per month" },
  //   agentIdentityAddress: "0x0000000000000000000000000000000000000000",
  //   agentId: 0,
  // },
];

const DEPLOYED_AVATAR_COLOR = "#F0B90B";

export function buildDeployedAgent(config: DeployedAgentConfig): Agent {
  return {
    id: `deployed-${config.category}`,
    slug: config.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: config.name,
    category: config.category,
    tagline: config.tagline,
    description: config.description,
    avatarColor: DEPLOYED_AVATAR_COLOR,
    agentId: config.agentId,
    agentIdentityAddress: config.agentIdentityAddress,
    chain: "BNB Smart Chain",
    builtWith: "BNB Agent Studio",
    reputation: { rating: 0, completedJobs: 0, successRate: 100, reviewCount: 0 },
    pricing: config.pricing,
    capabilities: config.capabilities,
    verified: true,
    featured: true,
  };
}
