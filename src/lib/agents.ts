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

  try {
    // For local agents, use the configured endpoint directly
    if (agent.a2aEndpoint && agent.a2aEndpoint.includes("localhost")) {
      return {
        ...agent,
        endpointStatus: "healthy",
        verified: false, // Will update once 8004scan indexes it
        reputation: {
          rating: 0,
          completedJobs: 0,
          successRate: 0,
          reviewCount: 0,
        },
      };
    }

    // Try to get endpoint info from Fly.io backend first
    let flyioEndpoint: string | null = null;
    let endpointProtocol: "mcp" | "a2a" | "unknown" = "unknown";
    let runtimeHealthy = false;
    
    // Use agent slug for Fly.io backend mapping
    const agentSlug = agent.slug;
    const flyioCard = await getFlyioAgentCard(agentSlug);
    
    if (flyioCard) {
      flyioEndpoint = extractEndpointFromAgentCard(flyioCard);
      endpointProtocol = flyioCard.protocol?.toLowerCase() as "mcp" | "a2a" | "unknown" || "unknown";
      
      // Check actual runtime health
      const healthCheck = await checkAgentRuntimeHealth(agentSlug);
      runtimeHealthy = healthCheck.status === "healthy";
      
      console.log(`[Fly.io] Found endpoint for ${agent.name}:`, flyioEndpoint, `Runtime healthy: ${runtimeHealthy}`);
    }

    // Get reputation and verification from 8004scan using the correct chain
    let scan: Awaited<ReturnType<typeof getAgent>> | null = null;
    try {
      scan = await getAgent(agent.identityChainId ?? 56, String(agent.agentId));
    } catch (scanErr) {
      console.warn(`[8004scan] lookup timed out/failed for agent ${agent.agentId}:`, scanErr);
    }
    
    // Use runtime health check for endpoint status, fallback to 8004scan, default to healthy if Fly.io is live
    const finalEndpointStatus = runtimeHealthy 
      ? "healthy" 
      : (scan ? scanEndpointStatus(scan) : (flyioEndpoint ? "healthy" : "unknown"));
    
    return {
      ...agent,
      verified: Boolean(scan?.is_verified),
      onChainName: scan?.name || agent.name,
      endpointStatus: finalEndpointStatus,
      // Prefer Fly.io endpoint if available, otherwise use 8004scan or base config
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
  } catch (error) {
    console.warn(`[Agent enrichment] Failed for ${agent.name}:`, error);
    return { 
      ...agent, 
      verified: false, 
      endpointStatus: "healthy",
      endpointProtocol: "a2a",
      x402Supported: false,
    };
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
