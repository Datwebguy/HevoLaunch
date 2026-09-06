"use client";

import { useSyncExternalStore } from "react";
import type { Agent, HireSession } from "@/lib/types";
import type { Task } from "@/lib/task-marketplace";

export type ActivityEventType =
  | "job_settled"
  | "job_hired"
  | "deliverable_submitted"
  | "feedback_received"
  | "identity_registered";

export interface AgentActivityItem {
  id: string;
  agentId: number | string;
  agentSlug?: string;
  type: ActivityEventType;
  title: string;
  description: string;
  amount?: string;
  client?: string;
  txHash?: string;
  jobId?: string;
  timestamp: string;
  status: "COMPLETED" | "FUNDED" | "SUBMITTED" | "VERIFIED" | "OPEN";
  deliverableSummary?: string;
}

export interface AgentActivityStats {
  totalJobsCompleted: number;
  totalVolumeU: number;
  avgResponseTime: string;
  successRate: string;
}

export type AgentActivityIdentifier =
  | Agent
  | number
  | string
  | {
      agentId?: number | string;
      slug?: string;
      id?: string;
      category?: string;
      name?: string;
      agentIdentityAddress?: string;
    };

function normalize(val?: unknown): string {
  return String(val ?? "").toLowerCase().trim();
}

export function matchesAgent(
  item: {
    agentId?: unknown;
    agentSlug?: unknown;
    agentCategory?: unknown;
    category?: unknown;
    provider?: unknown;
    assignedTo?: unknown;
    assignedProviderName?: unknown;
  },
  agentOrId: AgentActivityIdentifier
): boolean {
  if (!agentOrId) return false;

  let targetAgentId = "";
  let targetSlug = "";
  let targetId = "";
  let targetCategory = "";
  let targetAddress = "";
  let targetName = "";

  if (typeof agentOrId === "object" && agentOrId !== null) {
    targetAgentId = normalize(agentOrId.agentId);
    targetSlug = normalize(agentOrId.slug);
    targetId = normalize(agentOrId.id);
    targetCategory = normalize(agentOrId.category);
    targetAddress = normalize(agentOrId.agentIdentityAddress);
    targetName = normalize(agentOrId.name);
  } else {
    const raw = normalize(agentOrId);
    targetAgentId = raw;
    targetSlug = raw;
    targetId = raw;
    targetCategory = raw;
    targetAddress = raw;
  }

  // 1. Check direct agentId
  if (item.agentId) {
    const itemAgentId = normalize(item.agentId);
    if (
      (targetAgentId && itemAgentId === targetAgentId) ||
      (targetId && itemAgentId === targetId) ||
      (targetSlug && itemAgentId === targetSlug)
    ) {
      return true;
    }
  }

  // 2. Check agentSlug
  if (item.agentSlug) {
    const itemSlug = normalize(item.agentSlug);
    if (
      (targetSlug && itemSlug === targetSlug) ||
      (targetCategory && itemSlug === targetCategory) ||
      (targetAgentId && itemSlug === targetAgentId)
    ) {
      return true;
    }
  }

  // 3. Check agentCategory / category
  const itemCategory = normalize(item.agentCategory || item.category);
  if (itemCategory) {
    if (
      (targetCategory && itemCategory === targetCategory) ||
      (targetSlug && itemCategory === targetSlug) ||
      (targetSlug && targetSlug.includes(itemCategory.replace("-trading", "").replace("-optimisation", "").replace("-monitoring", "")))
    ) {
      return true;
    }
  }

  // 4. Check provider identity address
  if (item.provider && targetAddress) {
    if (normalize(item.provider) === targetAddress) {
      return true;
    }
  }

  // 5. Check task marketplace assignedTo
  if (item.assignedTo) {
    const assigned = normalize(item.assignedTo);
    if (
      (targetSlug && assigned === targetSlug) ||
      (targetId && assigned === targetId) ||
      (targetAgentId && assigned === targetAgentId) ||
      (targetAddress && assigned === targetAddress)
    ) {
      return true;
    }
  }

  // 6. Check assignedProviderName
  if (item.assignedProviderName && targetName) {
    const providerName = normalize(item.assignedProviderName);
    if (providerName.includes(targetName) || (targetSlug && providerName.includes(targetSlug))) {
      return true;
    }
  }

  return false;
}

export function getAgentActivity(agentOrId: AgentActivityIdentifier): AgentActivityItem[] {
  if (typeof window === "undefined") return [];

  const activities: AgentActivityItem[] = [];

  // 1. Process Altana direct hire sessions
  try {
    const rawSessions = localStorage.getItem("hevolaunch:hire-sessions");
    if (rawSessions) {
      const parsed: HireSession[] = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) {
        const agentSessions = parsed.filter((s) => matchesAgent(s, agentOrId));

        for (const s of agentSessions) {
          const isCompleted = s.status === "COMPLETED";
          const isSubmitted = s.status === "SUBMITTED";
          const isFunded = s.status === "FUNDED";

          const type: ActivityEventType = isCompleted
            ? "job_settled"
            : isSubmitted
            ? "deliverable_submitted"
            : "job_hired";

          const title = isCompleted
            ? "Job Delivered & Escrow Settled"
            : isSubmitted
            ? "Deliverable Submitted"
            : isFunded
            ? "Escrow Job Funded"
            : "Job Intent Created";

          let amountFormatted: string | undefined;
          if (s.budget) {
            try {
              const num = Number(s.budget) / 1e18;
              amountFormatted = isNaN(num) || num === 0 ? undefined : `${num < 0.01 ? num.toFixed(3) : num.toFixed(2)} $U`;
            } catch {
              amountFormatted = undefined;
            }
          }

          activities.push({
            id: `session-${s.id}`,
            agentId: s.agentId,
            agentSlug: s.agentSlug,
            type,
            title,
            description: s.task || "Non-custodial agent job executed via Altana ERC-8183 escrow.",
            amount: amountFormatted,
            client: s.hirerAddress
              ? `${s.hirerAddress.slice(0, 6)}...${s.hirerAddress.slice(-4)}`
              : s.connectedAddress
              ? `${s.connectedAddress.slice(0, 6)}...${s.connectedAddress.slice(-4)}`
              : undefined,
            txHash: s.txHash,
            jobId: s.jobId,
            timestamp: new Date(s.updatedAt || s.createdAt || (s.expiredAt ? s.expiredAt * 1000 : Date.now())).toISOString(),
            status: isCompleted ? "COMPLETED" : isSubmitted ? "SUBMITTED" : isFunded ? "FUNDED" : "OPEN",
            deliverableSummary: s.deliverableUrl
              ? `Deliverable: ${s.deliverableUrl}`
              : undefined,
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to read hire sessions for activity feed:", e);
  }

  // 2. Process Task Marketplace executions
  try {
    const rawTasks = localStorage.getItem("hevolaunch:tasks_v2") || localStorage.getItem("hevolaunch_tasks_v1");
    if (rawTasks) {
      const parsed: Task[] = JSON.parse(rawTasks);
      if (Array.isArray(parsed)) {
        const agentTasks = parsed.filter((t) => matchesAgent(t, agentOrId));

        for (const t of agentTasks) {
          const isAccepted = t.status === "accepted";
          const isDelivered = t.status === "delivered";
          const isInProgress = t.status === "in_progress" || t.status === "funded";

          const type: ActivityEventType = isAccepted
            ? "job_settled"
            : isDelivered
            ? "deliverable_submitted"
            : "job_hired";

          const title = isAccepted
            ? "Task Bounty Completed & Settled"
            : isDelivered
            ? "Task Deliverable Submitted"
            : isInProgress
            ? "Task Bounty In Progress"
            : "Task Bounty Published";

          activities.push({
            id: `task-${t.id}`,
            agentId: typeof agentOrId === "object" && agentOrId !== null ? agentOrId.agentId || agentOrId.id || t.id : t.id,
            agentSlug: typeof agentOrId === "object" && agentOrId !== null ? agentOrId.slug : undefined,
            type,
            title,
            description: t.description || t.title,
            amount: t.budget ? `${t.budget} ${t.currency || "$U"}` : undefined,
            client: t.createdBy
              ? `${t.createdBy.slice(0, 6)}...${t.createdBy.slice(-4)}`
              : undefined,
            txHash: t.escrowTxHash,
            jobId: t.id,
            timestamp: new Date(t.deliveredAt || t.updatedAt || t.createdAt || Date.now()).toISOString(),
            status: isAccepted ? "COMPLETED" : isDelivered ? "SUBMITTED" : isInProgress ? "FUNDED" : "OPEN",
            deliverableSummary: t.deliverableUrl
              ? `Deliverable: ${t.deliverableUrl}${t.deliverableNotes ? ` — ${t.deliverableNotes}` : ""}`
              : t.deliverableNotes
              ? t.deliverableNotes
              : undefined,
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to read task marketplace for activity feed:", e);
  }

  // Deduplicate by ID and sort descending by timestamp
  const seenIds = new Set<string>();
  const deduped: AgentActivityItem[] = [];

  for (const act of activities) {
    if (!seenIds.has(act.id)) {
      seenIds.add(act.id);
      deduped.push(act);
    }
  }

  return deduped.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getAgentActivityStats(activities: AgentActivityItem[]): AgentActivityStats {
  const completedJobs = activities.filter((a) => a.type === "job_settled" || a.status === "COMPLETED");

  let totalVolume = 0;
  for (const act of activities) {
    if (act.amount) {
      const num = parseFloat(act.amount.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) totalVolume += num;
    }
  }

  return {
    totalJobsCompleted: completedJobs.length,
    totalVolumeU: Number(totalVolume.toFixed(2)),
    avgResponseTime: activities.length > 0 ? "~25s" : "—",
    successRate: activities.length > 0 ? "100%" : "—",
  };
}

// Client synchronization hooks
const activityCache = new Map<string, { rawHire: string | null; rawTask: string | null; parsed: AgentActivityItem[] }>();

function subscribe(callback: () => void) {
  window.addEventListener("hevolaunch:hire-sessions-changed", callback);
  window.addEventListener("hevolaunch:tasks-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("hevolaunch:hire-sessions-changed", callback);
    window.removeEventListener("hevolaunch:tasks-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

const EMPTY_ACTIVITIES: AgentActivityItem[] = [];

export function useAgentActivity(agentOrId: AgentActivityIdentifier): AgentActivityItem[] {
  const agentKey =
    typeof agentOrId === "object" && agentOrId !== null
      ? `${agentOrId.id || ""}-${agentOrId.agentId || ""}-${agentOrId.slug || ""}-${agentOrId.category || ""}`
      : String(agentOrId);

  return useSyncExternalStore(
    subscribe,
    () => {
      if (typeof window === "undefined") return EMPTY_ACTIVITIES;
      const rawHire = localStorage.getItem("hevolaunch:hire-sessions");
      const rawTask = localStorage.getItem("hevolaunch:tasks_v2") || localStorage.getItem("hevolaunch_tasks_v1");
      const cached = activityCache.get(agentKey);
      if (cached && cached.rawHire === rawHire && cached.rawTask === rawTask) {
        return cached.parsed;
      }
      const activities = getAgentActivity(agentOrId);
      activityCache.set(agentKey, { rawHire, rawTask, parsed: activities });
      return activities;
    },
    () => EMPTY_ACTIVITIES
  );
}

