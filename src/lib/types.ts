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

export type ChainName = "BNB Smart Chain";

/** Reputation summary as surfaced by 8004scan. */
export interface AgentReputation {
  /** 0-5 star rating aggregated from on-chain feedback. */
  rating: number;
  /** Total number of completed jobs / hires. */
  completedJobs: number;
  /** Percentage of jobs completed successfully, 0-100. */
  successRate: number;
  /** Number of distinct reviewers/employers. */
  reviewCount: number;
}

/** Pricing as exposed through Altana (x402 + ERC-8183 sessions). */
export interface AgentPricing {
  model: "per-session" | "per-task" | "subscription" | "performance-fee";
  amount: number;
  currency: "USDC" | "BNB";
  /** Human readable cadence, e.g. "per month", "per rebalance". */
  cadence: string;
}

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
  chain: ChainName;
  builtWith: "BNB Agent Studio";
  reputation: AgentReputation;
  pricing: AgentPricing;
  capabilities: string[];
  verified: boolean;
  featured: boolean;
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

export type HireSessionStatus = JobStatusName | "FAILED";

export interface HireSession {
  /** Local record id (not the on-chain job id). */
  id: string;
  /** ERC-8183 job id once the hire has been submitted, as a string (bigint-safe for localStorage/JSON). */
  jobId?: string;
  agentId: string;
  agentSlug: string;
  agentCategory: CategorySlug;
  agentName: string;
  avatarColor: string;
  /** The buyer's Altana smart-account (passkey wallet) address — the ERC-8183 `client`. */
  hirerAddress: `0x${string}`;
  /** The agent's ERC-8004 identity address — the ERC-8183 `provider`. */
  provider: `0x${string}`;
  task: string;
  /** Escrowed amount in raw $U units (18 decimals), as a string. */
  budget: string;
  /** Unix seconds after which an unfunded/undelivered job can be reclaimed. */
  expiredAt: number;
  status: HireSessionStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * A single review as it would be sourced from 8004scan's reputation feed.
 * No 8004scan API docs have been provided yet, so this stays mock data —
 * unlike the Altana types above, nothing here is grounded in a real schema.
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
