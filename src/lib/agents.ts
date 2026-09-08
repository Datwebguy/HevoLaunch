import type { Agent, Category, CategorySlug } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { getAgentsForAllCategories } from "@/lib/deployed-agents";
import { getAgent, scanEndpointStatus } from "@/lib/8004scan";
import { getLiveAgentsForCategory, scanAgentToAgent, type LiveAgentsResult } from "@/lib/live-agents";
import {
  getFlyioAgentCard,
  extractEndpointFromAgentCard,
} from "@/lib/flyio-backend";
import { checkAgentRuntimeHealth } from "@/lib/agent-runtime-service";

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

    const finalEndpointStatus = flyioCard
      ? "healthy"
      : (scan ? scanEndpointStatus(scan) : "healthy");

    const enriched: Agent = {
      ...agent,
      verified: Boolean(scan?.is_verified),
      onChainName: scan?.name || agent.name,
      endpointStatus: finalEndpointStatus,
      a2aEndpoint: flyioEndpoint || scan?.a2a_endpoint || agent.a2aEndpoint,
      endpointProtocol: flyioEndpoint ? endpointProtocol : (scan?.a2a_endpoint ? "a2a" : "a2a"),
      x402Supported: Boolean(scan?.x402_supported),
      reputation: {
        rating: scan?.total_score ?? 0,
        completedJobs: 0,
        successRate: 0,
        reviewCount: scan?.total_feedbacks ?? 0,
      },
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
  const curated = await Promise.all(AGENTS.map(enrichAgent));
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
          if (curated.some((c) => c.agentId === Number(scan.token_id))) continue;
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
export async function getCategoryShelf(category: Category): Promise<CategoryShelf> {
  const [curated, live] = await Promise.all([
    Promise.all(getAgentsByCategory(category.slug).map(enrichAgent)),
    getLiveAgentsForCategory(category),
  ]);
  return { category, curated, live };
}
