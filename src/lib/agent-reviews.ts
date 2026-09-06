"use client";

import { useSyncExternalStore } from "react";
import type { Agent } from "@/lib/types";

export interface AgentReview {
  id: string;
  agentId: number | string;
  agentSlug?: string;
  reviewerAddress: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  tags: string[];
  createdAt: string;
  verified: boolean;
  jobId?: string;
  helpfulCount: number;
}

export interface AgentRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const STORAGE_KEY = "hevolaunch_agent_reviews_v1";
const HELPFUL_STORAGE_KEY = "hevolaunch_helpful_reviews_v1";
const CHANGE_EVENT = "hevolaunch:reviews-changed";

export type AgentReviewIdentifier =
  | Agent
  | number
  | string
  | {
      agentId?: number | string;
      slug?: string;
      id?: string;
      category?: string;
    };

function normalize(val?: unknown): string {
  return String(val ?? "").toLowerCase().trim();
}

function matchesReview(
  r: AgentReview,
  agentOrId: AgentReviewIdentifier
): boolean {
  if (!agentOrId) return false;

  let targetAgentId = "";
  let targetSlug = "";
  let targetId = "";
  let targetCategory = "";

  if (typeof agentOrId === "object" && agentOrId !== null) {
    targetAgentId = normalize(agentOrId.agentId);
    targetSlug = normalize(agentOrId.slug);
    targetId = normalize(agentOrId.id);
    targetCategory = normalize(agentOrId.category);
  } else {
    const raw = normalize(agentOrId);
    targetAgentId = raw;
    targetSlug = raw;
    targetId = raw;
    targetCategory = raw;
  }

  // 1. Check agentId field
  const revAgentId = normalize(r.agentId);
  if (revAgentId) {
    if (
      (targetAgentId && revAgentId === targetAgentId) ||
      (targetId && revAgentId === targetId) ||
      (targetSlug && revAgentId === targetSlug) ||
      (targetCategory && revAgentId === targetCategory)
    ) {
      return true;
    }
  }

  // 2. Check agentSlug field
  const revSlug = normalize(r.agentSlug);
  if (revSlug) {
    if (
      (targetSlug && revSlug === targetSlug) ||
      (targetCategory && revSlug === targetCategory) ||
      (targetAgentId && revSlug === targetAgentId) ||
      (targetId && revSlug === targetId)
    ) {
      return true;
    }
  }

  return false;
}

export function getAgentReviews(agentOrId: AgentReviewIdentifier): AgentReview[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const matches = parsed.filter((r: AgentReview) => matchesReview(r, agentOrId));

    return matches.sort(
      (a: AgentReview, b: AgentReview) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function getAgentRatingStats(reviews: AgentReview[]): AgentRatingStats {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const rev of reviews) {
    const r = Math.max(1, Math.min(5, Math.round(rev.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] || 0) + 1;
    sum += rev.rating;
  }

  const averageRating = Number((sum / reviews.length).toFixed(1));

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution,
  };
}

export function saveNewAgentReview(
  review: Omit<AgentReview, "id" | "createdAt" | "helpfulCount">
): AgentReview {
  const newRev: AgentReview = {
    ...review,
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
  };

  if (typeof window === "undefined") return newRev;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let allReviews: AgentReview[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) allReviews = parsed;
    }

    allReviews.unshift(newRev);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (e) {
    console.error("Failed to save review:", e);
  }

  return newRev;
}

export function toggleHelpfulVote(reviewId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const votedRaw = localStorage.getItem(HELPFUL_STORAGE_KEY);
    const voted: string[] = votedRaw ? JSON.parse(votedRaw) : [];

    if (voted.includes(reviewId)) {
      return false; // Already voted
    }

    voted.push(reviewId);
    localStorage.setItem(HELPFUL_STORAGE_KEY, JSON.stringify(voted));

    const raw = localStorage.getItem(STORAGE_KEY);
    let allReviews: AgentReview[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) allReviews = parsed;
    }

    const idx = allReviews.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      allReviews[idx].helpfulCount = (allReviews[idx].helpfulCount || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }

    return true;
  } catch {
    return false;
  }
}

// Client synchronization hooks
const reviewCache = new Map<string, { raw: string | null; parsed: AgentReview[] }>();

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const EMPTY_REVIEWS: AgentReview[] = [];

export function useAgentReviews(agentOrId: AgentReviewIdentifier): AgentReview[] {
  const agentKey =
    typeof agentOrId === "object" && agentOrId !== null
      ? `${agentOrId.id || ""}-${agentOrId.agentId || ""}-${agentOrId.slug || ""}-${agentOrId.category || ""}`
      : String(agentOrId);

  return useSyncExternalStore(
    subscribe,
    () => {
      if (typeof window === "undefined") return EMPTY_REVIEWS;
      const raw = localStorage.getItem(STORAGE_KEY);
      const cached = reviewCache.get(agentKey);
      if (cached && cached.raw === raw) {
        return cached.parsed;
      }
      const reviews = getAgentReviews(agentOrId);
      reviewCache.set(agentKey, { raw, parsed: reviews });
      return reviews;
    },
    () => EMPTY_REVIEWS
  );
}

