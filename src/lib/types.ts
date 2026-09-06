/**
 * Core domain types for HevoLaunch.
 *
 * These shapes are intentionally modeled after what will come back from
 * the real integrations (8004scan for identity/reputation, Altana for
 * hiring/payment sessions) so the mock data layer can be swapped for
 * live API calls without reshaping the UI.
 */

export type CategorySlug =
  | "rebalancing"
  | "grid-trading"
  | "yield-optimisation"
  | "health-factor-monitoring";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  /** One-sentence explanation of what an agent in this category does for a user. */
  tagline: string;
  /** Search term that finds this category's agents on the live 8004scan API. */
  discoveryQuery: string;
}

export type ChainName = "BNB Smart Chain" | "BNB Testnet";

/** A2A/MCP endpoint health as reported by 8004scan, when we have it. */
export type EndpointStatus = "healthy" | "unhealthy" | "unknown" | "coming-soon";

/** Reputation summary as surfaced by 8004scan. */
export interface AgentReputation {
  /** 8004scan `total_score` (0-100). Not a 5-star rating. */
  rating: number;
  /** Unused for display — 8004scan does not publish a completed-jobs count. */
  completedJobs: number;
  /** Unused for display unless reviewCount > 0. Never invent 100% on zero jobs. */
  successRate: number;
  /** 8004scan `total_feedbacks`. */
  reviewCount: number;
}

/**
 * Pricing as exposed through Altana (x402 + ERC-8183 sessions).
 * "$U" is the real ERC-8183 escrow currency (United Stables) — what a
 * bag-deployed seller actually gets paid in. "USDC"/"BNB" stay for
 * curated-listing display purposes.
 */
export interface AgentPricing {
  model: "per-session" | "per-task" | "subscription" | "performance-fee";
  amount: number;
  currency: "USDC" | "BNB" | "$U";
  /** Human readable cadence, e.g. "per month", "per rebalance". */
  cadence: string;
}

export type EndpointProtocol = "mcp" | "a2a" | "unknown";

export interface Agent {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  tagline: string;
  description: string;
  avatarColor: string;
  /**
   * ERC-8004 identity token id — a token in the identity registry whose
   * tokenURI is this agent's registration record (see lib/erc8004.ts).
   */
  agentId: number;
  /** The agent's Altana wallet address: ERC-8004 token owner and ERC-8183 `provider`. */
  agentIdentityAddress: `0x${string}`;
  /** ERC-8004 registry chain. Curated Hevo agents are registered on BSC testnet (97). */
  identityChainId: number;
  chain: ChainName;
  builtWith: "BNB Agent Studio";
  reputation: AgentReputation;
  pricing: AgentPricing;
  capabilities: string[];
  /** True only when 8004scan says `is_verified`. Never set locally. */
  verified: boolean;
  featured: boolean;
  endpointStatus: EndpointStatus;
  /** Name on the ERC-8004 record, which may still be the bag default (`studio-agent`). */
  onChainName?: string;
  /** A2A/MCP endpoint URL from 8004scan for direct agent calls. */
  a2aEndpoint?: string | null;
  /** Protocol type for the endpoint (MCP or A2A). */
  endpointProtocol?: EndpointProtocol;
  /** Whether the agent supports x402 payment protocol for per-request payments. */
  x402Supported?: boolean;
}

/**
 * Hiring & payments via Altana's ERC-8183 job-escrow rail (the "hire BNB
 * agents" standard — see docs.altana.network/sdk/erc8183). The buyer funds
 * a Job in $U against the agent's ERC-8004 identity address; the agent
 * submits a deliverable; after an optimistic dispute window the escrow
 * settles.
 *
 * `JOB_STATUS` below is order-locked with Altana's AgenticCommerce kernel —
 * these are the on-chain statuses, not ones we invented:
 *   OPEN -> FUNDED -> SUBMITTED -> COMPLETED (happy path)
 *                                -> REJECTED (disputed within the window)
 *   OPEN -> EXPIRED (never funded / provider never delivered)
 *
 * "FAILED" is the one status we add ourselves, for the pre-chain case where
 * funding the job itself never went through (wallet setup or relay error).
 */
export const JOB_STATUS = [
  "OPEN",
  "FUNDED",
  "SUBMITTED",
  "COMPLETED",
  "REJECTED",
  "EXPIRED",
] as const;

export type JobStatusName = (typeof JOB_STATUS)[number];

/**
 * "FAILED" and "UNFUNDED" are our own additions, not on-chain statuses:
 * FAILED is a pre-chain funding-call error, UNFUNDED means the hiring
 * wallet's real $U balance was checked and came up short before any
 * transaction was attempted.
 */
export type HireSessionStatus = JobStatusName | "FAILED" | "UNFUNDED";

export interface HireSession {
  /** Local record id (not the on-chain job id). */
  id: string;
  /** ERC-8183 job id once the hire has been submitted, as a string (bigint-safe for localStorage/JSON). */
  jobId?: string;
  /** The real funding transaction hash, once the job has been funded. */
  txHash?: `0x${string}`;
  /** The real deliverable URL, once the seller has submitted one on-chain. */
  deliverableUrl?: string;
  /** Structured deliverable payload or summary generated by the agent for this job. */
  deliverableData?: Record<string, unknown>;
  agentId: string;
  agentSlug: string;
  agentCategory: CategorySlug;
  agentName: string;
  avatarColor: string;
  /** The buyer's Altana smart-account (passkey wallet) address — the ERC-8183 `client`. */
  hirerAddress: `0x${string}`;
  /** The buyer's connected EOA wallet (MetaMask/Wagmi) address at time of hire, if connected. */
  connectedAddress?: `0x${string}`;
  /** The agent's ERC-8004 identity address — the ERC-8183 `provider`. */
  provider: `0x${string}`;
  task: string;
  /** Escrowed amount in raw $U units (18 decimals), as a string. */
  budget: string;
  /** Unix seconds after which an unfunded/undelivered job can be reclaimed. */
  expiredAt: number;
  status: HireSessionStatus;
  /** Relay or RPC error message when status is FAILED, or a status-refresh error. */
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * A single review as it would be sourced from 8004scan's reputation feed.
 * Not rendered anywhere yet — 8004scan's public agent payload exposes
 * `total_feedbacks` / `average_score`, not a per-review list we can show.
 */
export interface AgentReview {
  id: string;
  reviewerAddress: `0x${string}`;
  rating: number;
  comment: string;
  relativeTime: string;
}

/** A completed job entry contributing to an agent's on-chain track record. */
export interface AgentActivityEntry {
  id: string;
  label: string;
  detail: string;
  relativeTime: string;
}

/**
 * x402 payment protocol types for per-request agent payments.
 * Based on the x402 specification for Agent-to-Agent payments.
 */
export type X402PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface X402PaymentRequest {
  /** The agent's endpoint URL to call. */
  endpoint: string;
  /** The payment amount in the specified currency. */
  amount: string;
  /** Currency for payment (typically $U for ERC-8183 compatibility). */
  currency: string;
  /** Optional payment description/metadata. */
  description?: string;
  /** The agent's identity address for payment routing. */
  recipientAddress: `0x${string}`;
}

export interface X402PaymentResponse {
  /** Payment status. */
  status: X402PaymentStatus;
  /** Transaction hash if payment was successful. */
  txHash?: `0x${string}`;
  /** Payment ID for tracking. */
  paymentId?: string;
  /** Error message if payment failed. */
  error?: string;
  /** Timestamp of payment. */
  timestamp: number;
}

export interface EndpointCallRequest {
  /** The agent endpoint to call. */
  endpoint: string;
  /** Method to call (for MCP/A2A protocols). */
  method?: string;
  /** Parameters for the endpoint call. */
  parameters?: Record<string, string | number | boolean | null | undefined>;
  /** Whether this requires x402 payment. */
  requiresPayment: boolean;
  /** Payment details if payment is required. */
  payment?: X402PaymentRequest;
}

export interface EndpointCallResponse {
  /** Whether the call was successful. */
  success: boolean;
  /** Response data from the agent. */
  data?: Record<string, string | number | boolean | null | undefined>;
  /** Error message if the call failed. */
  error?: string;
  /** Payment result if payment was involved. */
  payment?: X402PaymentResponse;
  /** Response timestamp. */
  timestamp: number;
}
