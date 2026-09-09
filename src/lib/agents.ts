import type { Agent, Category, CategorySlug } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { getAgentsForAllCategories } from "@/lib/deployed-agents";
import { getAgent, scanEndpointStatus } from "@/lib/8004scan";
import { getLiveAgentsForCategory, scanAgentToAgent, type LiveAgentsResult } from "@/lib/live-agents";
import {
  getFlyioAgentCard,
  extractEndpointFromAgentCard,
} from "@/lib/flyio-backend";

/**
 * The hire-ready catalogue. Every entry is a real ERC-8004-registered
 * agent from deployed-agents.ts. Empty category = none live yet.
 *
 * Reputation / verified / endpoint health are overlaid from 8004scan at
 * request time (see enrichAgent). The static AGENTS array is the
 * routing/source list and starts unverified with zero score.
 */
export const AGENTS: Agent[] = getAgentsForAllCategories();

export function getAgentsByCategory(category: CategorySlug): Agent[] {
  return AGENTS.filter((a) => a.category === category);
}

export function getFeaturedAgents(): Agent[] {
  return AGENTS.filter((a) => a.featured);
}

function normalizeIdentityName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/agent$/, "");
}

/** Hide older duplicate ERC-8004 registrations when the canonical Hevo record is present. */
export function isDuplicateOfCurated(scan: { name: string; owner_address: string; token_id: string }, curated: Agent[]): boolean {
  const scanName = normalizeIdentityName(scan.name);
  const scanOwner = scan.owner_address.toLowerCase();
  return curated.some((agent) =>
    agent.agentIdentityAddress.toLowerCase() === scanOwner &&
    normalizeIdentityName(agent.name) === scanName
  );
}

export function getAgentBySlug(category: CategorySlug, slug: string): Agent | undefined {
  return AGENTS.find((a) => a.category === category && (a.slug === slug || String(a.agentId) === slug));
}

const enrichedAgentCache = new Map<string, { data: Agent; expiresAt: number }>();

export async function enrichAgent(agent: Agent): Promise<Agent> {
  // Skip 8004scan enrichment for unregistered agents
  if (agent.agentId === 0 || agent.agentIdentityAddress === "0x0000000000000000000000000000000000000000") {
    return {
      ...agent,
      endpointStatus: "coming-soon",
      a2aEndpoint: null,
      endpointProtocol: "unknown",
      x402Supported: false,
      dataSource: "unknown",
    };
  }

  // Fast-path: return cached enriched agent
  const cacheKey = `${agent.category}:${agent.slug}:${agent.agentId}`;
  const cached = enrichedAgentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    // For local agents, use the configured endpoint directly
    if (agent.a2aEndpoint && agent.a2aEndpoint.includes("localhost")) {
      const localResult: Agent = {
        ...agent,
        endpointStatus: "unknown",
        verified: false,
        reputation: {
          rating: 0,
          completedJobs: 0,
          successRate: 0,
          reviewCount: 0,
        },
      };
      enrichedAgentCache.set(cacheKey, { data: localResult, expiresAt: Date.now() + 60_000 });
      return localResult;
    }

    const agentSlug = agent.slug;
    const targetChainId = agent.identityChainId ?? 56;

    // Fetch Fly.io card and 8004scan metadata in parallel to minimize latency
    const [flyioRes, scanRes] = await Promise.allSettled([
      getFlyioAgentCard(agentSlug),
      getAgent(targetChainId, String(agent.agentId)),
    ]);

    const flyioCard = flyioRes.status === "fulfilled" ? flyioRes.value : null;
    const scan = scanRes.status === "fulfilled" ? scanRes.value : null;

    let flyioEndpoint: string | null = null;
    let endpointProtocol: "mcp" | "a2a" | "unknown" = "unknown";

    if (flyioCard) {
      flyioEndpoint = extractEndpointFromAgentCard(flyioCard);
      endpointProtocol = (flyioCard.protocol?.toLowerCase() as "mcp" | "a2a" | "unknown") || "a2a";
    }

    const registryEndpointStatus = scan ? scanEndpointStatus(scan) : "unknown";
    const finalEndpointStatus = scan?.a2a_endpoint ? registryEndpointStatus : "unknown";

    const enriched: Agent = {
      ...agent,
      verified: Boolean(scan?.chain_id === 56 && !scan.is_testnet && scan.is_verified),
      onChainName: scan?.name || agent.name,
      endpointStatus: scan ? finalEndpointStatus : "unknown",
      // The mainnet registry is the source of truth for the callable endpoint.
      // A Fly card is useful as a health fallback, but must not replace the
      // endpoint that the ERC-8004 record proves.
      a2aEndpoint: scan?.a2a_endpoint || flyioEndpoint || agent.a2aEndpoint,
      endpointProtocol: scan?.a2a_endpoint ? "a2a" : (flyioEndpoint ? endpointProtocol : "a2a"),
      x402Supported: Boolean(scan?.x402_supported),
      reputation: {
        rating: scan?.total_score ?? 0,
        completedJobs: 0,
        successRate: 0,
        reviewCount: scan?.total_feedbacks ?? 0,
      },
      dataSource: scan ? "8004scan" : "unknown",
      dataUpdatedAt: scan?.updated_at,
    };

    enrichedAgentCache.set(cacheKey, { data: enriched, expiresAt: Date.now() + 60_000 });
    return enriched;
  } catch (error) {
    console.warn(`[Agent enrichment] Failed for ${agent.name}:`, error);
    const fallback: Agent = {
      ...agent,
      verified: false,
      endpointStatus: "unknown",
      endpointProtocol: "a2a",
      x402Supported: false,
    };
    enrichedAgentCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 30_000 });
    return fallback;
  }
}

export async function getCatalogue(): Promise<Agent[]> {
  const curated = (await Promise.all(AGENTS.map(enrichAgent))).filter(
    (agent) => agent.identityChainId === 56 && agent.endpointStatus === "healthy"
  );
  try {
    const liveResults = await Promise.all(
      CATEGORIES.map((cat) => getLiveAgentsForCategory(cat))
    );
    const communityAgents: Agent[] = [];
    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const live = liveResults[i];
      if (live && live.agents) {
        for (const scan of live.agents) {
          // Avoid duplicates with our curated flagship agents
          if (curated.some((c) => c.agentId === Number(scan.token_id)) || isDuplicateOfCurated(scan, curated)) continue;
          communityAgents.push(scanAgentToAgent(scan, cat.slug));
        }
      }
    }
    return [...curated, ...communityAgents];
  } catch {
    return curated;
  }
}

export interface CategoryShelf {
  category: Category;
  curated: Agent[];
  live: LiveAgentsResult | null;
}

/**
 * Homepage shelf per category: returns hire-ready flagship agents
 * alongside qualified community agents from the decentralized registry.
 */
export async function getCategoryShelf(
  category: Category,
  options: { includeLive?: boolean } = {}
): Promise<CategoryShelf> {
  const includeLive = options.includeLive ?? true;
  const [curated, liveResult] = await Promise.all([
    includeLive
      ? Promise.all(getAgentsByCategory(category.slug).map(enrichAgent)).then((agents) =>
          agents.filter((agent) => agent.identityChainId === 56 && agent.endpointStatus === "healthy")
        )
      : Promise.resolve([]),
    includeLive ? getLiveAgentsForCategory(category) : Promise.resolve(null),
  ]);
  const live = liveResult
    ? { ...liveResult, agents: liveResult.agents.filter((scan) => !isDuplicateOfCurated(scan, curated)) }
    : null;
  return { category, curated, live };
}
