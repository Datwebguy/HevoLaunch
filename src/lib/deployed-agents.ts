import type { Agent, AgentPricing, CategorySlug } from "@/lib/types";
import { IDENTITY_CHAIN_ID } from "@/lib/erc8004";

/**
 * Hire-ready agents deployed with BNB Agent Studio on BSC testnet (97)
 * and registered on 8004scan. Fill one in per category once it's live.
 * Leave a category empty and the site shows an honest empty state —
 * never a fabricated listing.
 *
 * Where to get each value:
 *  - agentIdentityAddress: the wallet `bag deploy agent` prints / writes
 *    to .studio/wallets (ERC-8004 token owner, ERC-8183 provider).
 *  - agentId: the token id from https://8004scan.io/agents/97/<tokenId>
 *    (testnet, not mainnet 56). Confirm with getAgent(97, tokenId).
 *
 * `verified` and reputation are NOT set here. lib/agents.ts overlays
 * live 8004scan data at request time. A local `verified: true` with
 * zero jobs was a lie — don't put it back.
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
  {
    category: "rebalancing",
    name: "Hevo Rebalance",
    tagline: "Reads your portfolio and tells you exactly what to trade.",
    description:
      "Reads a wallet's current holdings against a target allocation and returns the exact trade set needed to close the drift — tokens to sell, tokens to buy, and the resulting allocation. It analyses and recommends; it never executes a trade itself.",
    capabilities: ["Portfolio drift analysis", "Target-weight recommendations", "Read-only, no custody"],
    pricing: { model: "per-task", amount: 8, currency: "$U", cadence: "per analysis" },
    agentIdentityAddress: "0x06F757064043e57dBbCCD6D95Ee1113D9796c715",
    agentId: 1865,
  },
  {
    category: "grid-trading",
    name: "Hevo Grid",
    tagline: "Designs optimized grid parameters and volatility capture targets.",
    description:
      "Computes a grid trading plan for a pair and price range — levels, order sizes, and expected capture — as a deliverable a buyer (or their own bot) can execute. It designs the grid; it does not place live orders itself.",
    capabilities: [
      "Grid trading plan generation",
      "Volatility capture estimation",
      "Custom price bounds & level sizing",
    ],
    pricing: { model: "per-task", amount: 10, currency: "$U", cadence: "per plan" },
    agentIdentityAddress: "0x26dFfA1C42ff523Ee70F208a22424A2aEa4Df928",
    agentId: 2018,
  },
  {
    category: "yield-optimisation",
    name: "Hevo Yield",
    tagline: "Scans and compares yields across Venus, Aave V3, and Lista.",
    description:
      "Compares yield opportunities across BNB Chain lending and liquid staking protocols (Venus, Aave V3, Lista DAO) and delivers an optimal allocation recommendation. It analyses and recommends; it does not move funds itself.",
    capabilities: [
      "Cross-protocol APY comparison",
      "Venus & Aave V3 market analysis",
      "Lista liquid staking yield routing",
    ],
    pricing: { model: "per-task", amount: 10, currency: "$U", cadence: "per recommendation" },
    agentIdentityAddress: "0x1058E2411e6F5fC581b3744aA5bD2884D430C206",
    agentId: 2019,
  },
  {
    category: "health-factor-monitoring",
    name: "Hevo Sentinel",
    tagline: "Monitors lending health factors and delivers buffer defense plans.",
    description:
      "Checks lending positions against safety thresholds on Venus and Aave V3, alerting on liquidation risks and computing precise collateral/debt remedies to restore safe buffers. It monitors and alerts; it does not execute top-ups directly.",
    capabilities: [
      "Lending health factor monitoring",
      "Liquidation risk alerting",
      "Buffer restoration recommendations",
    ],
    pricing: { model: "per-task", amount: 10, currency: "$U", cadence: "per check" },
    agentIdentityAddress: "0x9F23164d9da521ee06bc49F5945870ce52dEedCD",
    agentId: 2020,
  },
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
    identityChainId: IDENTITY_CHAIN_ID,
    chain: "BNB Testnet",
    builtWith: "BNB Agent Studio",
    reputation: { rating: 0, completedJobs: 0, successRate: 0, reviewCount: 0 },
    pricing: config.pricing,
    capabilities: config.capabilities,
    verified: false,
    featured: true,
    endpointStatus: "unknown",
    a2aEndpoint: null,
    endpointProtocol: "unknown",
    x402Supported: false,
  };
}
