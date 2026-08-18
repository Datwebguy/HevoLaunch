import { listAgents, type ScanAgent } from "@/lib/8004scan";
import type { Category } from "@/lib/types";

/**
 * Server-side live-data layer for category pages — real agents registered
 * on BNB Smart Chain mainnet (chainId 56), fetched via 8004scan's public
 * API and matched to a category by `category.discoveryQuery` (see
 * lib/categories.ts). Runs in a Server Component with Next's fetch cache
 * (5 min revalidate, set in lib/8004scan.ts) rather than client-side, so
 * a page full of visitors doesn't turn into a burst of calls against
 * 8004scan's 10 req/min anonymous limit.
 *
 * Real registrations right now have zero feedback (the whole ERC-8004
 * ecosystem on BSC is new) and no advertised price — ERC-8183 has the
 * buyer propose a job budget, not the agent list one — so this section
 * is presented as genuinely-live discovery, separate from HevoLaunch's
 * own curated, hire-ready catalogue rather than pretending to be the
 * same kind of listing.
 */

const MAINNET_CHAIN_ID = 56;
const LIVE_AGENTS_PER_CATEGORY = 4;

export interface LiveAgentsResult {
  agents: ScanAgent[];
  total: number;
  failed: boolean;
}

export async function getLiveAgentsForCategory(
  category: Pick<Category, "discoveryQuery">
): Promise<LiveAgentsResult> {
  try {
    const { agents, total } = await listAgents({
      chainId: MAINNET_CHAIN_ID,
      search: category.discoveryQuery,
      sortBy: "total_score",
      limit: LIVE_AGENTS_PER_CATEGORY,
    });
    return { agents, total, failed: false };
  } catch {
    return { agents: [], total: 0, failed: true };
  }
}

export function relativeTimeFrom(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.round(diffDays / 30)}mo ago`;
}
