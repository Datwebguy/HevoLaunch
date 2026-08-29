import type { Agent, Category, CategorySlug } from "@/lib/types";
import { buildDeployedAgent, DEPLOYED_AGENTS } from "@/lib/deployed-agents";
import { getAgent, scanEndpointStatus } from "@/lib/8004scan";
import { IDENTITY_CHAIN_ID } from "@/lib/erc8004";
import { getLiveAgentsForCategory, type LiveAgentsResult } from "@/lib/live-agents";

/**
 * The hire-ready catalogue. Every entry is a real ERC-8004-registered
 * agent from deployed-agents.ts. Empty category = none live yet.
 *
 * Reputation / verified / endpoint health are overlaid from 8004scan at
 * request time (see enrichAgent). The static AGENTS array is the
 * routing/source list and starts unverified with zero score.
 */
export const AGENTS: Agent[] = DEPLOYED_AGENTS.map(buildDeployedAgent);

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
  try {
    const scan = await getAgent(agent.identityChainId ?? IDENTITY_CHAIN_ID, String(agent.agentId));
    return {
      ...agent,
      verified: Boolean(scan.is_verified),
      onChainName: scan.name,
      endpointStatus: scanEndpointStatus(scan),
      a2aEndpoint: scan.a2a_endpoint,
      endpointProtocol: scan.a2a_endpoint ? "a2a" : "unknown",
      x402Supported: scan.x402_supported,
      reputation: {
        rating: scan.total_score,
        completedJobs: 0,
        successRate: 0,
        reviewCount: scan.total_feedbacks,
      },
    };
  } catch {
    return { 
      ...agent, 
      verified: false, 
      endpointStatus: "unknown",
      a2aEndpoint: null,
      endpointProtocol: "unknown",
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
