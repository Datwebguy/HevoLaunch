import { getAgent, listAgents, MAINNET_CHAIN_ID, scanEndpointStatus, type ScanAgent } from "@/lib/8004scan";
import { filterQualifiedAgents } from "@/lib/agent-quality";
import type { Agent, Category, CategorySlug } from "@/lib/types";

/**
 * Server-side live-data layer for category pages — real agents registered
 * on BNB Smart Chain (chainId 56), fetched via 8004scan and
 * matched to a category by `category.discoveryQuery` (see
 * lib/categories.ts). Runs in a Server Component with Next's fetch cache
 * (see lib/8004scan.ts for the revalidate window — shorter on the Pro
 * tier's 180 req/min than the 10 req/min anonymous fallback) rather than
 * client-side, so a page full of visitors doesn't turn into a burst of
 * direct API calls.
 *
 * Real registrations right now have zero feedback (the whole ERC-8004
 * ecosystem on BSC is new) and no advertised price — ERC-8183 has the
 * buyer propose a job budget, not the agent list one — so this section
 * is presented as genuinely-live discovery, separate from HevoLaunch's
 * own curated, hire-ready catalogue rather than pretending to be the
 * same kind of listing.
 */

const LIVE_FETCH_LIMIT = 40;
const LIVE_AGENTS_SHOWN = 8;

export interface LiveAgentsResult {
  agents: ScanAgent[];
  total: number;
  scanned: number;
  qualified: number;
  rejected: number;
  failed: boolean;
}

export async function getLiveAgentsForCategory(
  category: Pick<Category, "discoveryQuery">,
  query?: string
): Promise<LiveAgentsResult> {
  const trimmed = query?.trim();
  try {
    const { agents, total } = await listAgents({
      chainId: MAINNET_CHAIN_ID,
      search: trimmed || category.discoveryQuery,
      sortBy: "total_score",
      limit: trimmed ? LIVE_FETCH_LIMIT : LIVE_FETCH_LIMIT,
    });
    const { qualified: qualityQualified, rejected, scanned } = filterQualifiedAgents(agents);
    // The registry search endpoint is not a trusted classifier. Require the
    // category term to appear in the agent's own metadata before displaying
    // it under that desk, otherwise generic agents get mislabeled repeatedly.
    const categoryTerm = category.discoveryQuery.toLowerCase();
    const categoryMatches = qualityQualified.filter((agent) => {
      const haystack = [agent.name, agent.description, ...(agent.supported_protocols || [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(categoryTerm);
    });

    // The list endpoint omits the detailed health/endpoint object. Hydrate
    // only category matches before applying the healthy-endpoint gate; this
    // keeps the catalogue honest without rejecting real healthy records just
    // because the summary response is sparse.
    const hydrated = await Promise.all(
      categoryMatches.slice(0, LIVE_FETCH_LIMIT).map(async (agent) => {
        try {
          return await getAgent(MAINNET_CHAIN_ID, agent.token_id);
        } catch {
          return agent;
        }
      })
    );
    const qualified = hydrated.filter((agent) => {
      // A mainnet record with a healthy live endpoint is displayable. The
      // separate 8004scan verification flag remains visible and is never
      // upgraded locally.
      return agent.is_active !== false && scanEndpointStatus(agent) === "healthy";
    });
    return {
      agents: qualified.slice(0, LIVE_AGENTS_SHOWN),
      total,
      scanned,
      qualified: qualified.length,
      rejected,
      failed: false,
    };
  } catch {
    return { agents: [], total: 0, scanned: 0, qualified: 0, rejected: 0, failed: true };
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

export function scanAgentToAgent(scan: ScanAgent, categorySlug?: CategorySlug): Agent {
  if (scan.chain_id !== MAINNET_CHAIN_ID || scan.is_testnet) {
    throw new Error("Only BSC mainnet agents can be displayed.");
  }
  return {
    id: `live-${scan.chain_id}-${scan.token_id}`,
    slug: `live-${scan.token_id}`,
    name: scan.name,
    category: categorySlug || "rebalancing",
    tagline: scan.description ? scan.description.slice(0, 110).trim() : "Autonomous AI agent registered on BNB Smart Chain",
    description: scan.description || "",
    avatarColor: "#F0B90B",
    avatarUrl: scan.image_url,
    agentId: Number(scan.token_id),
    agentIdentityAddress: (scan.owner_address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    identityChainId: scan.chain_id,
    chain: "BNB Smart Chain",
    builtWith: "BNB Agent Studio",
    reputation: {
      rating: scan.total_score,
      completedJobs: 0,
      successRate: 0,
      reviewCount: scan.total_feedbacks,
    },
    pricing: {
      model: "quote",
      amount: 0,
      currency: "$U",
      cadence: "live provider quote",
    },
    capabilities: scan.supported_protocols && scan.supported_protocols.length > 0
      ? scan.supported_protocols
      : ["Autonomous execution", "On-chain verification"],
    verified: scan.is_verified,
    featured: false,
    endpointStatus: scanEndpointStatus(scan),
    a2aEndpoint: scan.a2a_endpoint || null,
    endpointProtocol: scan.a2a_endpoint ? "a2a" : "unknown",
    dataSource: "8004scan",
    dataUpdatedAt: scan.updated_at,
  };
}
