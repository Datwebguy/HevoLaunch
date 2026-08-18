import type { Agent, AgentActivityEntry, AgentReview } from "@/lib/types";

/**
 * Mock reviews and activity for an agent's profile page. No 8004scan API
 * docs have been shared yet, so unlike lib/altana.ts and lib/erc8004.ts
 * this is not grounded in a real schema — it exists purely to make the
 * profile page's Reviews/Activity tabs demoable. Generated deterministically
 * from the agent (no Math.random) so statically-generated pages don't
 * change between builds.
 */

const REVIEW_COMMENTS = [
  "Set it up in a few minutes and it's been running without any issues since.",
  "Does exactly what it says — no surprises, no hidden fees.",
  "Support was responsive when I had a question about the strategy config.",
  "Solid track record so far. Would recommend to anyone on BNB Chain.",
  "Took a little tuning to get the parameters right, but works well now.",
  "One of the more transparent agents I've hired — every action is on-chain.",
];

function seedFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function fakeAddress(seed: number): `0x${string}` {
  return `0x${seed.toString(16).padStart(8, "0").repeat(5).slice(0, 40)}` as `0x${string}`;
}

export function getAgentReviews(agent: Agent): AgentReview[] {
  const seed = seedFromString(agent.id);
  const relativeTimes = ["3 days ago", "1 week ago", "3 weeks ago"];

  return relativeTimes.map((relativeTime, i) => {
    const commentIndex = (seed + i * 7) % REVIEW_COMMENTS.length;
    const ratingOffset = ((seed + i) % 3) * 0.1 - 0.1;
    const rating = Math.min(5, Math.max(3.5, agent.reputation.rating + ratingOffset));

    return {
      id: `${agent.id}-review-${i + 1}`,
      reviewerAddress: fakeAddress(seed + i * 101),
      rating: Math.round(rating * 10) / 10,
      comment: REVIEW_COMMENTS[commentIndex],
      relativeTime,
    };
  });
}

const ACTIVITY_TEMPLATES: Record<Agent["category"], { label: string; detail: string }[]> = {
  rebalancing: [
    { label: "Rebalance executed", detail: "Trimmed 3.2% overweight BNB back to target allocation" },
    { label: "Drift check", detail: "Portfolio within 0.8% of target — no action taken" },
    { label: "Rebalance executed", detail: "Rotated 1,200 USDC into underweight assets" },
    { label: "Policy update", detail: "Rebalance band widened per owner request" },
  ],
  "grid-trading": [
    { label: "Grid order filled", detail: "Buy filled at 0.985 of range midpoint" },
    { label: "Grid recentred", detail: "Range shifted up 4% to track price" },
    { label: "Grid order filled", detail: "Sell filled, profit locked in for this cycle" },
    { label: "Stop-loss check", detail: "Price within safe range — no action taken" },
  ],
  "yield-optimisation": [
    { label: "Position moved", detail: "Migrated liquidity to a higher-APY vault" },
    { label: "Rewards compounded", detail: "Harvested and reinvested accrued yield" },
    { label: "Yield scan", detail: "Scanned 14 markets — current allocation still optimal" },
    { label: "Position moved", detail: "Reduced exposure to a market nearing incentive expiry" },
  ],
  "health-factor-monitoring": [
    { label: "Health factor check", detail: "Position steady at 1.8 — no action needed" },
    { label: "Collateral topped up", detail: "Added collateral after health factor dropped to 1.2" },
    { label: "Alert sent", detail: "Notified owner of rising liquidation risk" },
    { label: "Health factor check", detail: "Position steady at 2.1 — no action needed" },
  ],
};

export function getAgentActivity(agent: Agent): AgentActivityEntry[] {
  const templates = ACTIVITY_TEMPLATES[agent.category];
  const relativeTimes = ["1 day ago", "4 days ago", "1 week ago", "2 weeks ago"];

  return templates.map((entry, i) => ({
    id: `${agent.id}-activity-${i + 1}`,
    label: entry.label,
    detail: entry.detail,
    relativeTime: relativeTimes[i],
  }));
}
