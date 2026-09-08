import type { Agent, AgentPricing, CategorySlug } from "@/lib/types";
import { IDENTITY_CHAIN_ID } from "@/lib/erc8004";

/**
 * Hire-ready agents that are registered on BNB Smart Chain **mainnet (56)**
 * and proven on 8004scan. Empty until that proof exists.
 *
 * Do not paste a testnet token id onto chain 56. A token id is only valid
 * after the corresponding mainnet registration is visible on 8004scan and
 * its endpoint has been verified.
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
      "Reads a wallet's current holdings against a target allocation and returns the exact trade set needed to close the drift, including tokens to sell, tokens to buy, and the resulting allocation. It analyses and recommends, it never executes a trade itself.",
    capabilities: ["Portfolio drift analysis", "Target-weight recommendations", "Read-only, no custody"],
    pricing: { model: "per-task", amount: 0.05, currency: "$U", cadence: "per analysis" },
    agentIdentityAddress: "0x75A0C2d1Df51C07982De3Ff031E5232518676B19",
    agentId: 340535,
  },
  {
    category: "grid-trading",
    name: "Hevo Grid",
    tagline: "Designs optimized grid parameters and volatility capture targets.",
    description:
      "Computes a grid trading plan for a pair and price range covering levels, order sizes, and expected capture as a deliverable a buyer (or their own bot) can execute. It designs the grid; it does not place live orders itself.",
    capabilities: [
      "Grid trading plan generation",
      "Volatility capture estimation",
      "Custom price bounds & level sizing",
    ],
    pricing: { model: "per-task", amount: 0.05, currency: "$U", cadence: "per plan" },
    agentIdentityAddress: "0x75A0C2d1Df51C07982De3Ff031E5232518676B19",
    agentId: 340534,
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
    pricing: { model: "per-task", amount: 0.05, currency: "$U", cadence: "per recommendation" },
    agentIdentityAddress: "0x75A0C2d1Df51C07982De3Ff031E5232518676B19",
    agentId: 340532,
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
    pricing: { model: "per-task", amount: 0.05, currency: "$U", cadence: "per check" },
    agentIdentityAddress: "0x75A0C2d1Df51C07982De3Ff031E5232518676B19",
    agentId: 340533,
  },
];

const DEPLOYED_AVATAR_COLOR = "#F0B90B";

export function buildDeployedAgent(config: DeployedAgentConfig): Agent {
  const shortCategory = config.category
    .replace("-trading", "")
    .replace("-optimisation", "")
    .replace("-monitoring", "")
    .replace("rebalancing", "rebalance");

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
    chain: "BNB Smart Chain",
    builtWith: "BNB Agent Studio",
    reputation: { rating: 0, completedJobs: 0, successRate: 0, reviewCount: 0 },
    pricing: config.pricing,
    capabilities: config.capabilities,
    verified: true,
    featured: true,
    endpointStatus: "healthy",
    a2aEndpoint: `https://hevo-agents.fly.dev/${shortCategory}/.well-known/agent-card.json`,
    endpointProtocol: "a2a",
    x402Supported: false,
  };
}

export function getAgentsForAllCategories(): Agent[] {
  return DEPLOYED_AGENTS.map(buildDeployedAgent);
}
