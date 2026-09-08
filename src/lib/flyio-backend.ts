/**
 * Fly.io Backend Integration
 * 
 * Connects to the Hevo Agent Hub backend deployed on Fly.io at https://hevo-agents.fly.dev
 * This backend provides agent card metadata and endpoint information for the deployed agents.
 */

const FLYIO_BACKEND_URL = "https://hevo-agents.fly.dev";

export interface FlyioAgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  protocol: string;
  capabilities: string[];
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  services: Array<{
    name: string;
    version: string;
    endpoint: string;
  }>;
  skills: Array<{
    name: string;
    description: string;
    parameters: Record<string, { type: string; required: boolean }>;
  }>;
}

export interface FlyioBackendStatus {
  name: string;
  network: string;
  status: string;
  agents: string[];
  endpoints: Record<string, string>;
}

/**
 * Map any agent slug or category to the live Fly.io backend route.
 * Live Fly.io routes are: /rebalance, /grid, /yield, /sentinel
 */
export function slugToBackendEndpoint(slugOrCategory: string): string {
  const normalized = slugOrCategory.toLowerCase();
  if (normalized.includes("rebalance") || normalized.includes("busbro")) return "rebalance";
  if (normalized.includes("grid") || normalized.includes("btc0721")) return "grid";
  if (normalized.includes("yield") || normalized.includes("jasony")) return "yield";
  if (normalized.includes("sentinel") || normalized.includes("health") || normalized.includes("dorvath")) return "sentinel";
  return "rebalance";
}

/**
 * Get the backend status and available agents
 */
export async function getFlyioBackendStatus(): Promise<FlyioBackendStatus | null> {
  try {
    const response = await fetch(`${FLYIO_BACKEND_URL}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(`Fly.io backend returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("[Fly.io] Failed to fetch backend status:", error);
    return null;
  }
}

/**
 * Get agent card for a specific agent type
 * Maps agent slugs to live Fly.io backend endpoints
 */
export async function getFlyioAgentCard(agentSlugOrCategory: string): Promise<FlyioAgentCard | null> {
  try {
    const backendEndpoint = slugToBackendEndpoint(agentSlugOrCategory);
    const cardUrl = `${FLYIO_BACKEND_URL}/${backendEndpoint}/.well-known/agent-card.json`;
    
    const response = await fetch(cardUrl, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    }).catch(() => null);

    if (!response || !response.ok) {
      return null;
    }
    const card: FlyioAgentCard = await response.json();
    return card;
  } catch (error) {
    console.warn(`[Fly.io] Failed to fetch agent card for ${agentSlugOrCategory}:`, error);
    return null;
  }
}

/**
 * Map agent category to Fly.io backend agent type
 */
export function categoryToAgentType(category: string): string {
  return slugToBackendEndpoint(category);
}

/**
 * Extract endpoint URL from Fly.io agent card
 * Returns the base URL from the agent card which serves as the endpoint
 * Converts HTTP to HTTPS for secure connections
 */
export function extractEndpointFromAgentCard(card: FlyioAgentCard): string | null {
  if (!card.url) return null;
  return card.url.replace(/^http:/, "https:");
}

/**
 * Check if Fly.io backend is healthy and available
 */
export async function isFlyioBackendHealthy(): Promise<boolean> {
  const status = await getFlyioBackendStatus();
  return status?.status === "healthy";
}