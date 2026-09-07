/**
 * 8004scan API client — https://8004scan.io/developers
 *
 * Two separate surfaces exist, verified live, not assumed from docs:
 *
 *  - `/api/v1/public/*` — anonymous, 10 req/min. Response envelope:
 *    `{ success, data, meta: { pagination } }`.
 *  - `/api/v1/*` (no "public") — the real Pro-tier surface. An API key
 *    here (`X-API-Key` header) actually raises the rate limit (confirmed
 *    via response headers: 180/min, 20000/day vs 10/min on the public
 *    path even with a key attached — the public path ignores the key
 *    entirely). Response envelope is different: list endpoints return
 *    `{ items, total, limit, offset }`, no `success`/`data` wrapper; a
 *    single agent returns the agent object directly, no wrapper at all.
 *
 * SCAN_8004_API_KEY in .env.local (server-only, never NEXT_PUBLIC_ — these
 * calls only ever run in Server Components) switches listAgents onto the
 * authenticated surface. Unset, it falls back to the public one, so this
 * still works with nothing configured. Calls go through Next's `fetch`
 * cache with a revalidate window (see lib/live-agents.ts) so real visitor
 * traffic doesn't translate 1:1 into API calls; every call site fails
 * soft (empty result) rather than breaking the page.
 *
 * Confirmed live: chain_id 56 = BSC mainnet, 97 = BSC Testnet. The
 * registry contract at 97 (0x8004a818bfb912233c491871b3d84c89a494bd9e)
 * matches `erc8183Addresses(97).registry` from @altananetwork/sdk exactly
 * — see lib/erc8004.ts — which cross-confirms both sources.
 */

import type { EndpointStatus } from "@/lib/types";

const PUBLIC_BASE_URL = "https://8004scan.io/api/v1/public";
const AUTH_BASE_URL = "https://8004scan.io/api/v1";

export function scanAgentUrl(chainId: number, tokenId: string | number): string {
  if (chainId === 97) {
    return `https://testnet.8004scan.io/agents/bsc-testnet/${tokenId}`;
  }
  return `https://8004scan.io/agents/bsc/${tokenId}`;
}

export interface ScanAgentHealth {
  overall_status?: string;
}

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
  is_endpoint_verified?: boolean;
  star_count: number;
  supported_protocols: string[];
  x402_supported: boolean;
  /** 0-100 scale. */
  total_score: number;
  total_feedbacks: number;
  average_score: number;
  a2a_endpoint?: string | null;
  health_status?: ScanAgentHealth | null;
  created_at: string;
  updated_at: string;
}

export function scanEndpointStatus(agent: ScanAgent): EndpointStatus {
  const overall = agent.health_status?.overall_status;
  if (overall === "healthy") return "healthy";
  if (overall === "unhealthy" || overall === "degraded") return "unhealthy";
  if (agent.is_endpoint_verified) return "healthy";
  return "unknown";
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

interface PublicListResponse<T> {
  success: boolean;
  data: T[];
  meta: { pagination: { page: number; limit: number; total: number; hasMore: boolean } };
}

interface PublicItemResponse<T> {
  success: boolean;
  data: T;
}

interface AuthListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

function apiKey(): string | undefined {
  return process.env.SCAN_8004_API_KEY;
}

const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
  revalidateSeconds: number
): Promise<T> {
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", ...headers },
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        if (attempt < maxRetries && (res.status === 429 || res.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
        throw new Error(`8004scan request failed: ${res.status}`);
      }

      const json = await res.json();
      memoryCache.set(url, { data: json, expiresAt: Date.now() + revalidateSeconds * 1000 });
      return json;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`8004scan request failed for ${url}`);
}

function withParams(base: string, path: string, params?: Record<string, string | number | boolean>) {
  const url = new URL(base + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function getStats(): Promise<ScanStats> {
  const res = await fetchJson<PublicItemResponse<ScanStats>>(
    withParams(PUBLIC_BASE_URL, "/stats"),
    {},
    300
  );
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
  const key = apiKey();

  if (key) {
    // Pro tier (180 req/min) has real headroom — refresh more often than
    // the anonymous fallback below.
    //
    // Confirmed live (not assumed): the authenticated surface takes
    // snake_case query keys (chain_id, sort_by) — the public surface's
    // camelCase names (chainId, sortBy) are silently ignored here rather
    // than erroring, which previously let cross-chain agents leak into
    // a "BNB Chain" filtered result with no error to catch it.
    const query: Record<string, string | number | boolean> = {
      ...(params.search ? { search: params.search } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.chainId !== undefined ? { chain_id: params.chainId } : {}),
      ...(params.sortBy ? { sort_by: params.sortBy } : {}),
    };
    const res = await fetchJson<AuthListResponse<ScanAgent>>(
      withParams(AUTH_BASE_URL, "/agents", query),
      { "X-API-Key": key },
      60
    );
    return { agents: res.items, total: res.total };
  }

  const query = { ...params, ...(params.limit ? { limit: params.limit } : {}) };
  const res = await fetchJson<PublicListResponse<ScanAgent>>(
    withParams(PUBLIC_BASE_URL, "/agents", query),
    {},
    300
  );
  return { agents: res.data, total: res.meta.pagination.total };
}

export async function getAgent(chainId: number, tokenId: string): Promise<ScanAgent> {
  const key = apiKey();
  if (key) {
    return fetchJson<ScanAgent>(
      withParams(AUTH_BASE_URL, `/agents/${chainId}/${tokenId}`),
      { "X-API-Key": key },
      300
    );
  }
  const res = await fetchJson<PublicItemResponse<ScanAgent>>(
    withParams(PUBLIC_BASE_URL, `/agents/${chainId}/${tokenId}`),
    {},
    300
  );
  return res.data;
}
