import type { Agent, Category, CategorySlug } from "@/lib/types";
import { getAgentsForAllCategories } from "@/lib/deployed-agents";
import { getAgent, scanEndpointStatus } from "@/lib/8004scan";
import { getLiveAgentsForCategory, type LiveAgentsResult } from "@/lib/live-agents";
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
  return AGENTS.find((a) => a.category === category && a.slug === slug);
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
        endpointStatus: "healthy",
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
      endpointStatus: "healthy",
      endpointProtocol: "a2a",
      x402Supported: false,
    };
    enrichedAgentCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 30_000 });
    return fallback;
  }
}

export async function getCatalogue(): Promise<Agent[]> {
  return Promise.all(AGENTS.map(enrichAgent));
}

export interface CategoryShelf {
  category: Category;
  curated: Agent[];
  live: LiveAgentsResult | null;
}

/**
 * Homepage shelf per category: hire-ready agents if any, otherwise a
 * live 8004scan preview so every mandatory category has equal visible
 * depth without fabricating listings.
 */
export async function getCategoryShelf(category: Category): Promise<CategoryShelf> {
  const curated = await Promise.all(getAgentsByCategory(category.slug).map(enrichAgent));
  if (curated.length > 0) {
    return { category, curated, live: null };
  }
  return { category, curated, live: await getLiveAgentsForCategory(category) };
}
