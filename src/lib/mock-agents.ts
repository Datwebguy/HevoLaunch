import type { Agent, AgentPricing, CategorySlug } from "@/lib/types";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { buildDeployedAgent, DEPLOYED_AGENTS } from "@/lib/deployed-agents";

/**
 * Placeholder catalogue used until the 8004scan discovery API and BNB
 * Agent Studio registry are wired in (see project-plan.md, Phase 1/2).
 *
 * IMPORTANT: every category gets exactly the same number of agents with
 * the same field completeness. This is deliberate — "equal depth across
 * all 4 categories" is a hard judging criterion, and generating the
 * catalogue from one shared template is what enforces that at build time
 * rather than relying on manual upkeep.
 */

const AVATAR_COLORS = [
  "#F0B90B", // BNB gold
  "#0EA5E9",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#EC4899",
];

interface AgentTemplate {
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  pricing: AgentPricing;
  rating: number;
  completedJobs: number;
  successRate: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
}

const TEMPLATES: Record<CategorySlug, AgentTemplate[]> = {
  rebalancing: [
    {
      name: "Balancer Prime",
      tagline: "Target-weight rebalancing across your whole portfolio.",
      description:
        "Continuously monitors wallet composition against a target allocation and executes minimal-slippage trades on BNB Chain DEXs to bring it back in line.",
      capabilities: ["Target-weight allocation", "Drift-triggered execution", "Multi-DEX routing", "Slippage guardrails"],
      pricing: { model: "subscription", amount: 25, currency: "USDC", cadence: "per month" },
      rating: 4.8,
      completedJobs: 1240,
      successRate: 99.2,
      reviewCount: 312,
      verified: true,
      featured: true,
    },
    {
      name: "EqualWeight Bot",
      tagline: "Simple, transparent equal-weight rebalancing.",
      description:
        "Splits a basket of tokens into equal weights and rebalances on a fixed schedule, prioritising predictability over complexity.",
      capabilities: ["Equal-weight baskets", "Scheduled rebalancing", "Gas-aware batching"],
      pricing: { model: "per-task", amount: 2, currency: "USDC", cadence: "per rebalance" },
      rating: 4.5,
      completedJobs: 860,
      successRate: 98.4,
      reviewCount: 201,
      verified: true,
      featured: false,
    },
    {
      name: "ThresholdGuard",
      tagline: "Only trades when drift crosses your threshold.",
      description:
        "Rebalances only when an asset's weight drifts past a configurable band, minimising unnecessary trading and fees.",
      capabilities: ["Configurable drift bands", "Fee-minimising logic", "On-chain audit trail"],
      pricing: { model: "performance-fee", amount: 8, currency: "USDC", cadence: "% of rebalanced value" },
      rating: 4.6,
      completedJobs: 540,
      successRate: 97.9,
      reviewCount: 133,
      verified: true,
      featured: false,
    },
    {
      name: "Vault Weighted",
      tagline: "Rebalancing built for DAO and vault treasuries.",
      description:
        "Designed for multi-sig treasuries — proposes and executes rebalancing trades within pre-approved policy limits.",
      capabilities: ["Multi-sig compatible", "Policy-limited trading", "Treasury reporting"],
      pricing: { model: "subscription", amount: 120, currency: "USDC", cadence: "per month" },
      rating: 4.7,
      completedJobs: 96,
      successRate: 100,
      reviewCount: 28,
      verified: true,
      featured: false,
    },
    {
      name: "MomentumTrim",
      tagline: "Rebalances with a momentum-aware tilt.",
      description:
        "Blends target-weight rebalancing with short-term momentum signals to avoid selling into strength or buying into weakness.",
      capabilities: ["Momentum overlay", "Target-weight base", "Custom rebalance windows"],
      pricing: { model: "per-session", amount: 15, currency: "USDC", cadence: "per session" },
      rating: 4.3,
      completedJobs: 410,
      successRate: 96.8,
      reviewCount: 97,
      verified: false,
      featured: false,
    },
    {
      name: "StableCore",
      tagline: "Conservative rebalancing for stable-heavy portfolios.",
      description:
        "Optimised for portfolios anchored in stablecoins with a smaller volatile sleeve, keeping risk exposure tightly bounded.",
      capabilities: ["Risk-bounded sleeves", "Stablecoin-first logic", "Low-frequency trading"],
      pricing: { model: "subscription", amount: 18, currency: "USDC", cadence: "per month" },
      rating: 4.4,
      completedJobs: 275,
      successRate: 98.1,
      reviewCount: 64,
      verified: true,
      featured: false,
    },
  ],
  "grid-trading": [
    {
      name: "GridForge",
      tagline: "Battle-tested grid trading for BNB pairs.",
      description:
        "Deploys and manages buy/sell grids across a configurable price range, capturing volatility on high-liquidity BNB Chain pairs.",
      capabilities: ["Dynamic grid spacing", "Range auto-adjustment", "Multi-pair support", "Stop-loss guard"],
      pricing: { model: "performance-fee", amount: 10, currency: "USDC", cadence: "% of grid profit" },
      rating: 4.9,
      completedJobs: 2100,
      successRate: 98.7,
      reviewCount: 480,
      verified: true,
      featured: true,
    },
    {
      name: "TightRange Grid",
      tagline: "High-frequency grids for range-bound markets.",
      description:
        "Runs narrow, high-density grids optimised for sideways markets, rebalancing the grid center as the range shifts.",
      capabilities: ["Narrow-band grids", "Auto-recentring", "High-frequency fills"],
      pricing: { model: "per-session", amount: 20, currency: "USDC", cadence: "per session" },
      rating: 4.5,
      completedJobs: 690,
      successRate: 97.5,
      reviewCount: 150,
      verified: true,
      featured: false,
    },
    {
      name: "WideNet Grid",
      tagline: "Wide-range grids built to survive volatility.",
      description:
        "Spreads orders across a wide price band so the grid keeps working through larger swings without running out of range.",
      capabilities: ["Wide-band grids", "Volatility sizing", "Capital-efficient sizing"],
      pricing: { model: "subscription", amount: 30, currency: "USDC", cadence: "per month" },
      rating: 4.4,
      completedJobs: 512,
      successRate: 96.9,
      reviewCount: 118,
      verified: true,
      featured: false,
    },
    {
      name: "GridPilot",
      tagline: "Set-and-forget grid trading with guardrails.",
      description:
        "A beginner-friendly grid agent with sensible defaults, built-in stop-loss, and automatic profit-taking.",
      capabilities: ["Guided setup", "Built-in stop-loss", "Auto profit-taking"],
      pricing: { model: "per-task", amount: 5, currency: "USDC", cadence: "per grid deployed" },
      rating: 4.2,
      completedJobs: 330,
      successRate: 95.6,
      reviewCount: 88,
      verified: false,
      featured: false,
    },
    {
      name: "Arbitrage Grid",
      tagline: "Grid trading blended with cross-DEX arbitrage.",
      description:
        "Runs a standard grid while opportunistically routing fills through the best-priced DEX to squeeze extra edge per trade.",
      capabilities: ["Cross-DEX routing", "Grid + arbitrage blend", "MEV-aware execution"],
      pricing: { model: "performance-fee", amount: 12, currency: "USDC", cadence: "% of grid profit" },
      rating: 4.6,
      completedJobs: 780,
      successRate: 97.1,
      reviewCount: 176,
      verified: true,
      featured: false,
    },
    {
      name: "GridTreasury",
      tagline: "Institutional-grade grids for treasuries.",
      description:
        "Runs multiple concurrent grids across correlated pairs with position limits suited to DAO and fund treasuries.",
      capabilities: ["Multi-grid orchestration", "Position limits", "Treasury-grade reporting"],
      pricing: { model: "subscription", amount: 150, currency: "USDC", cadence: "per month" },
      rating: 4.7,
      completedJobs: 64,
      successRate: 100,
      reviewCount: 19,
      verified: true,
      featured: false,
    },
  ],
  "yield-optimisation": [
    {
      name: "YieldRoute",
      tagline: "Always in the best yield on BNB Chain.",
      description:
        "Continuously scans lending markets, LPs, and vaults across BNB Chain, moving capital to the best risk-adjusted yield.",
      capabilities: ["Cross-protocol scanning", "Auto-compounding", "Risk-tiered vault selection", "Gas-optimised moves"],
      pricing: { model: "performance-fee", amount: 10, currency: "USDC", cadence: "% of yield earned" },
      rating: 4.8,
      completedJobs: 1580,
      successRate: 99.0,
      reviewCount: 402,
      verified: true,
      featured: true,
    },
    {
      name: "StableYield",
      tagline: "Low-risk yield across stablecoin markets only.",
      description:
        "Sticks to audited, stablecoin-only lending markets and LPs, prioritising capital preservation over maximum APY.",
      capabilities: ["Stablecoin-only markets", "Audited-protocol filter", "Capital preservation mode"],
      pricing: { model: "subscription", amount: 15, currency: "USDC", cadence: "per month" },
      rating: 4.6,
      completedJobs: 940,
      successRate: 99.4,
      reviewCount: 245,
      verified: true,
      featured: false,
    },
    {
      name: "LP Compound",
      tagline: "Auto-compounding for concentrated LP positions.",
      description:
        "Harvests and reinvests LP rewards on a schedule, keeping positions compounding without manual claims.",
      capabilities: ["Auto-harvest", "Reward compounding", "Position rebalancing"],
      pricing: { model: "performance-fee", amount: 8, currency: "USDC", cadence: "% of harvested yield" },
      rating: 4.5,
      completedJobs: 720,
      successRate: 98.2,
      reviewCount: 167,
      verified: true,
      featured: false,
    },
    {
      name: "YieldScout",
      tagline: "Finds new yield opportunities before they crowd.",
      description:
        "Surfaces newly-launched vaults and incentive programs on BNB Chain, sizing positions conservatively as they prove out.",
      capabilities: ["New-vault detection", "Conservative position sizing", "Incentive tracking"],
      pricing: { model: "per-session", amount: 12, currency: "USDC", cadence: "per session" },
      rating: 4.1,
      completedJobs: 305,
      successRate: 95.1,
      reviewCount: 74,
      verified: false,
      featured: false,
    },
    {
      name: "Delta Neutral Yield",
      tagline: "Market-neutral yield strategies.",
      description:
        "Pairs yield-bearing positions with offsetting hedges to earn yield with reduced directional price exposure.",
      capabilities: ["Delta-neutral hedging", "Funding-rate capture", "Automated rebalancing"],
      pricing: { model: "subscription", amount: 45, currency: "USDC", cadence: "per month" },
      rating: 4.7,
      completedJobs: 210,
      successRate: 97.6,
      reviewCount: 58,
      verified: true,
      featured: false,
    },
    {
      name: "TreasuryYield",
      tagline: "Institutional yield optimisation for treasuries.",
      description:
        "Allocates idle treasury capital across a whitelisted set of vetted protocols under strict risk limits.",
      capabilities: ["Whitelisted protocols only", "Strict risk limits", "Treasury-grade reporting"],
      pricing: { model: "subscription", amount: 180, currency: "USDC", cadence: "per month" },
      rating: 4.8,
      completedJobs: 58,
      successRate: 100,
      reviewCount: 21,
      verified: true,
      featured: false,
    },
  ],
  "health-factor-monitoring": [
    {
      name: "LiquidGuard",
      tagline: "24/7 liquidation protection for your positions.",
      description:
        "Watches lending positions across BNB Chain money markets and automatically tops up collateral or repays debt before health factor drops critically low.",
      capabilities: ["Real-time HF monitoring", "Auto top-up collateral", "Auto-repay on threshold", "Multi-protocol coverage"],
      pricing: { model: "subscription", amount: 20, currency: "USDC", cadence: "per month" },
      rating: 4.9,
      completedJobs: 3400,
      successRate: 99.8,
      reviewCount: 610,
      verified: true,
      featured: true,
    },
    {
      name: "HF Sentinel",
      tagline: "Alerts first, acts only when you allow it.",
      description:
        "Sends real-time alerts as health factor drops, with optional auto-execution once you approve an action policy.",
      capabilities: ["Real-time alerts", "Approval-gated execution", "Custom threshold tiers"],
      pricing: { model: "subscription", amount: 8, currency: "USDC", cadence: "per month" },
      rating: 4.5,
      completedJobs: 1120,
      successRate: 98.9,
      reviewCount: 289,
      verified: true,
      featured: false,
    },
    {
      name: "DeRisk Auto",
      tagline: "Automatically de-risks before liquidation.",
      description:
        "When health factor approaches danger zones, partially unwinds leveraged positions to restore a safe buffer.",
      capabilities: ["Partial position unwind", "Safe-buffer targeting", "Cross-market coverage"],
      pricing: { model: "performance-fee", amount: 5, currency: "USDC", cadence: "% of collateral saved" },
      rating: 4.6,
      completedJobs: 860,
      successRate: 99.1,
      reviewCount: 201,
      verified: true,
      featured: false,
    },
    {
      name: "CollateralTopper",
      tagline: "Keeps a standby buffer ready to deploy.",
      description:
        "Holds a reserve of collateral and automatically deploys it to your position the moment health factor crosses your line.",
      capabilities: ["Standby collateral buffer", "Instant deployment", "Configurable reserve size"],
      pricing: { model: "per-task", amount: 3, currency: "USDC", cadence: "per top-up" },
      rating: 4.3,
      completedJobs: 640,
      successRate: 98.0,
      reviewCount: 142,
      verified: false,
      featured: false,
    },
    {
      name: "MultiMarket Watch",
      tagline: "One dashboard for health factor across every market.",
      description:
        "Aggregates positions across every lending market you use on BNB Chain into a single monitored health factor view.",
      capabilities: ["Cross-market aggregation", "Unified alerting", "Position-level breakdown"],
      pricing: { model: "subscription", amount: 12, currency: "USDC", cadence: "per month" },
      rating: 4.4,
      completedJobs: 505,
      successRate: 98.6,
      reviewCount: 116,
      verified: true,
      featured: false,
    },
    {
      name: "SafeMargin",
      tagline: "Institutional-grade liquidation protection.",
      description:
        "Built for large, multi-sig-held positions — de-risks or tops up collateral within pre-approved policy bounds.",
      capabilities: ["Multi-sig compatible", "Policy-bounded actions", "Audit-ready action log"],
      pricing: { model: "subscription", amount: 200, currency: "USDC", cadence: "per month" },
      rating: 4.9,
      completedJobs: 71,
      successRate: 100,
      reviewCount: 24,
      verified: true,
      featured: false,
    },
  ],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Deterministic-looking (but not literally valid, checksum-free) mock
 * address — real hex digits only, seeded by agentId so it's stable across
 * builds. The previous version padded the category name straight into the
 * "address" (e.g. "0x0003rebalancing000...") — not even valid hex, and
 * visibly fake the moment anyone actually looked at it.
 */
function mockHexAddress(seed: number): `0x${string}` {
  // A naive LCG's low bits are degenerate (short-period, mostly constant) —
  // this is a small mulberry32-style mixer instead, which gives well
  // distributed hex nibbles from a tiny integer seed.
  let state = seed >>> 0;
  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }
  let hex = "";
  while (hex.length < 40) {
    hex += next().toString(16).padStart(8, "0");
  }
  return `0x${hex.slice(0, 40)}` as `0x${string}`;
}

function buildAgents(): Agent[] {
  const agents: Agent[] = [];
  let agentId = 1;

  for (const category of CATEGORY_SLUGS) {
    const templates = TEMPLATES[category];
    templates.forEach((t, i) => {
      const slug = slugify(t.name);
      agents.push({
        id: `${category}-${i + 1}`,
        slug,
        name: t.name,
        category,
        tagline: t.tagline,
        description: t.description,
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        agentId: agentId,
        agentIdentityAddress: mockHexAddress(agentId++),
        chain: "BNB Smart Chain",
        builtWith: "BNB Agent Studio",
        reputation: {
          rating: t.rating,
          completedJobs: t.completedJobs,
          successRate: t.successRate,
          reviewCount: t.reviewCount,
        },
        pricing: t.pricing,
        capabilities: t.capabilities,
        verified: t.verified,
        featured: t.featured,
      });
    });
  }

  // Swap in real deployed agents where configured — same array slot, same
  // category counts, so "equal depth" holds regardless of how many
  // categories have a real agent live yet.
  for (const config of DEPLOYED_AGENTS) {
    const slot = agents.findIndex((a) => a.category === config.category && a.featured);
    if (slot !== -1) {
      agents[slot] = buildDeployedAgent(config);
    }
  }

  return agents;
}

export const AGENTS: Agent[] = buildAgents();

export function getAgentsByCategory(category: CategorySlug): Agent[] {
  return AGENTS.filter((a) => a.category === category);
}

export function getFeaturedAgents(): Agent[] {
  return AGENTS.filter((a) => a.featured);
}

export function getAgentBySlug(category: CategorySlug, slug: string): Agent | undefined {
  return AGENTS.find((a) => a.category === category && a.slug === slug);
}
