/**
 * 8004scan public API client — https://8004scan.io/developers
 *
 * Base URL, endpoints, and field names below were verified with live
 * requests against the real API (not just the published OpenAPI summary,
 * which turned out to disagree with the live response on a few fields —
 * e.g. `token_id` is a string on the wire, not an integer).
 *
 * Anonymous access is unauthenticated but rate-limited (10 req/min,
 * 100/day) — no Pro API key is configured in this environment. Calls made
 * from Server Components (category pages) go through Next's `fetch` cache
 * with a revalidate window (see lib/live-agents.ts) so real visitor
 * traffic doesn't translate 1:1 into API calls; every call site still
 * fails soft (empty result) rather than breaking the page.
 *
 * Confirmed live: chain_id 56 = BSC mainnet, 97 = BSC Testnet. The
 * registry contract at 97 (0x8004a818bfb912233c491871b3d84c89a494bd9e)
 * matches `erc8183Addresses(97).registry` from @altananetwork/sdk exactly
 * — see lib/erc8004.ts — which cross-confirms both sources.
 */

const BASE_URL = "https://8004scan.io/api/v1/public";

export interface ScanAgent {
  id: string;
  agent_id: string;
  token_id: string;
  chain_id: number;
  contract_address: string;
  is_testnet: boolean;
  owner_address: string;
  name: string;
  description: string;
  image_url: string | null;
  is_verified: boolean;
  star_count: number;
  supported_protocols: string[];
  x402_supported: boolean;
  /** 0-100 scale — not the 0-5 star scale HevoLaunch's own listings use for display. */
  total_score: number;
  total_feedbacks: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

export interface ScanStats {
  total_agents: number;
  total_users: number;
  total_feedbacks: number;
  total_validations: number;
  daily_new_agents: number;
  daily_feedbacks: number;
  average_feedback_score: number;
}

interface ScanListResponse<T> {
  success: boolean;
  data: T[];
  meta: { pagination: { page: number; limit: number; total: number; hasMore: boolean } };
}

interface ScanResponse<T> {
  success: boolean;
  data: T;
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
  revalidateSeconds = 300
): Promise<T> {
  const url = new URL(BASE_URL + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: revalidateSeconds },
    // A slow 8004scan response shouldn't stall the whole page render —
    // fail fast and let callers fall back to an empty/cached result.
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`8004scan request failed: ${res.status}`);
  }
  return res.json();
}

export async function getStats(): Promise<ScanStats> {
  const res = await get<ScanResponse<ScanStats>>("/stats");
  return res.data;
}

export interface ListAgentsParams {
  chainId?: number;
  search?: string;
  limit?: number;
  sortBy?: "created_at" | "stars" | "name" | "token_id" | "total_score";
}

export async function listAgents(
  params: ListAgentsParams
): Promise<{ agents: ScanAgent[]; total: number }> {
  const res = await get<ScanListResponse<ScanAgent>>("/agents", {
    ...params,
    ...(params.limit ? { limit: params.limit } : {}),
  });
  return { agents: res.data, total: res.meta.pagination.total };
}

export async function getAgent(chainId: number, tokenId: string): Promise<ScanAgent> {
  const res = await get<ScanResponse<ScanAgent>>(`/agents/${chainId}/${tokenId}`);
  return res.data;
}
