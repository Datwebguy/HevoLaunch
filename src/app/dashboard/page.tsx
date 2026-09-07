"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { useAllHireSessions, useHireSessions, saveSession, deleteSession, clearFailedSessions } from "@/lib/hire-sessions";
import { explorerTxUrl, refreshJobStatus } from "@/lib/altana";
import type { HireSession } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";
import { JobDetailsDialog } from "@/components/hiring/job-details-dialog";
import { Trash2 } from "lucide-react";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type StatusFilter = "all" | "active" | "completed" | "issues";

function SessionRow({ session }: { session: HireSession }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(session.error ?? null);
  const canRefresh =
    !!session.jobId &&
    (session.status === "OPEN" ||
      session.status === "FUNDED" ||
      session.status === "SUBMITTED");
  const canDelete = session.status === "FAILED" || session.status === "UNFUNDED" || session.status === "EXPIRED" || !session.jobId;
  const isFundedOrDelivered = session.status === "FUNDED" || session.status === "SUBMITTED" || session.status === "COMPLETED";

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const updated = await refreshJobStatus(session);
      saveSession(updated);
      if (updated.error) setRefreshError(updated.error);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Could not refresh status.");
    } finally {
      setRefreshing(false);
    }
  }

  function handleDelete() {
    deleteSession(session.id);
  }

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-3.5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground shadow-sm"
              style={{ backgroundColor: session.avatarColor }}
              aria-hidden
            >
              {session.agentName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/agents/${session.agentCategory}/${session.agentSlug}`}
                  className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {session.agentName}
                </Link>
                {session.jobId && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    Job #{session.jobId}
                  </Badge>
                )}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{session.task}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>Hiring Account: <span className="font-mono text-foreground">{truncate(session.hirerAddress)}</span></span>
                {session.connectedAddress && (
                  <span>Linked EOA: <span className="font-mono text-foreground">{truncate(session.connectedAddress)}</span></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 border-t border-border/50 pt-3 text-sm sm:flex-row sm:items-center sm:border-0 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="font-semibold text-foreground">
                {formatUnits(BigInt(session.budget), 18)} $U
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {session.txHash && (
                  <a
                    href={explorerTxUrl(session.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    BscScan
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isFundedOrDelivered && (
                <JobDetailsDialog session={session} />
              )}
              <SessionStatusBadge status={session.status} />
              {canRefresh && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh status from chain"
                >
                  <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
                  <span className="sr-only">Refresh status</span>
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  title="Remove draft record"
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Delete session</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {refreshError && (
          <div className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {refreshError}
          </div>
        )}
        {session.status === "FAILED" && session.error && !refreshError && (
          <div className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {session.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const allSessions = useAllHireSessions();
  const accountSessions = useHireSessions(connectedAddress);

  const [viewScope, setViewScope] = useState<"wallet" | "all">("wallet");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshingAll, setRefreshingAll] = useState(false);

  // Active sessions based on scope
  const scopedSessions = useMemo(() => {
    if (viewScope === "wallet" && isConnected && connectedAddress) {
      return accountSessions;
    }
    return allSessions;
  }, [viewScope, isConnected, connectedAddress, accountSessions, allSessions]);

  // Apply status filter
  const filteredSessions = useMemo(() => {
    return scopedSessions.filter((s) => {
      if (statusFilter === "active") {
        return s.status === "OPEN" || s.status === "FUNDED" || s.status === "SUBMITTED";
      }
      if (statusFilter === "completed") {
        return s.status === "COMPLETED";
      }
      if (statusFilter === "issues") {
        return s.status === "FAILED" || s.status === "UNFUNDED" || s.status === "EXPIRED" || s.status === "REJECTED";
      }
      return true;
    });
  }, [scopedSessions, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: scopedSessions.length,
      active: scopedSessions.filter((s) => s.status === "OPEN" || s.status === "FUNDED" || s.status === "SUBMITTED").length,
      completed: scopedSessions.filter((s) => s.status === "COMPLETED").length,
      issues: scopedSessions.filter((s) => s.status === "FAILED" || s.status === "UNFUNDED" || s.status === "EXPIRED" || s.status === "REJECTED").length,
    };
  }, [scopedSessions]);

  // Background auto-refresh for active jobs (every 12 seconds)
  const refreshActiveSessions = useCallback(async () => {
    const active = allSessions.filter(
      (s) => !!s.jobId && (s.status === "OPEN" || s.status === "FUNDED" || s.status === "SUBMITTED")
    );
    if (active.length === 0) return;

    for (const session of active) {
      try {
        const updated = await refreshJobStatus(session);
        if (updated.status !== session.status || updated.deliverableUrl !== session.deliverableUrl) {
          saveSession(updated);
        }
      } catch {
        // Silently skip background poll errors
      }
    }
  }, [allSessions]);

  useEffect(() => {
    const interval = setInterval(refreshActiveSessions, 12000);
    return () => clearInterval(interval);
  }, [refreshActiveSessions]);

  async function handleRefreshAll() {
    setRefreshingAll(true);
    try {
      await refreshActiveSessions();
    } finally {
      setRefreshingAll(false);
    }
  }

  return (
    <div className="page-wrap py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
            My hires
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real ERC-8183 escrow jobs on BNB Smart Chain and live deliverable statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {counts.issues > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => clearFailedSessions(viewScope === "wallet" ? connectedAddress : undefined)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              title="Clear failed and unfunded draft sessions"
            >
              <Trash2 className="size-3.5" />
              Clear drafts ({counts.issues})
            </Button>
          )}
          {counts.active > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshAll}
              disabled={refreshingAll}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${refreshingAll ? "animate-spin text-primary" : ""}`} />
              {refreshingAll ? "Updating..." : "Refresh active"}
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/agents">Browse agents</Link>
          </Button>
        </div>
      </div>

      {/* Account Scoping Selector */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-xs">
          <Wallet className="size-4 text-primary" />
          {isConnected && connectedAddress ? (
            <span className="text-muted-foreground">
              Connected: <span className="font-mono font-medium text-foreground">{truncate(connectedAddress)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              No wallet connected in header. Showing device-local hires.
            </span>
          )}
        </div>

        {isConnected && (
          <div className="flex items-center gap-1.5 rounded-md bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewScope("wallet")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewScope === "wallet"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Wallet ({accountSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                viewScope === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3" />
              All Device ({allSessions.length})
            </button>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      {scopedSessions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="text-xs"
          >
            All ({counts.all})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className="text-xs"
          >
            Active ({counts.active})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter("completed")}
            className="text-xs"
          >
            <CheckCircle2 className="mr-1 size-3 text-success" />
            Completed ({counts.completed})
          </Button>
          {counts.issues > 0 && (
            <Button
              size="sm"
              variant={statusFilter === "issues" ? "default" : "outline"}
              onClick={() => setStatusFilter("issues")}
              className="text-xs"
            >
              <AlertTriangle className="mr-1 size-3 text-destructive" />
              Needs Attention ({counts.issues})
            </Button>
          )}
        </div>
      )}

      {/* Main List / Empty States */}
      {filteredSessions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-card px-6 py-12 text-center">
          {viewScope === "wallet" && isConnected && allSessions.length > 0 ? (
            <div className="mx-auto max-w-md space-y-3">
              <p className="text-base font-semibold text-foreground">
                No hires found for connected wallet {truncate(connectedAddress || "")}
              </p>
              <p className="text-xs text-muted-foreground">
                You have {allSessions.length} total job(s) created on this browser under other accounts.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="sm" variant="outline" onClick={() => setViewScope("all")}>
                  View All Device Hires ({allSessions.length})
                </Button>
                <Button size="sm" asChild>
                  <Link href="/agents">Hire with this wallet</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-3">
              <p className="text-base font-semibold text-foreground">
                {statusFilter !== "all"
                  ? `No ${statusFilter} hires found.`
                  : "You haven't hired any agents yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                Discover verified AI agents on BNB Chain, fund them with $U escrow, and receive autonomous deliverables.
              </p>
              <div className="pt-2">
                <Button size="sm" asChild>
                  <Link href="/agents" className="gap-1.5">
                    Browse agents
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredSessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
