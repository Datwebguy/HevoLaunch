"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { ExternalLink, RefreshCw } from "lucide-react";

import { useHireSessions, saveSession } from "@/lib/hire-sessions";
import { explorerTxUrl, refreshJobStatus } from "@/lib/altana";
import type { HireSession } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function SessionRow({ session }: { session: HireSession }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(session.error ?? null);
  const canRefresh =
    !!session.jobId &&
    (session.status === "OPEN" ||
      session.status === "FUNDED" ||
      session.status === "SUBMITTED");

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

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-primary-foreground"
            style={{ backgroundColor: session.avatarColor }}
            aria-hidden
          >
            {session.agentName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <Link
              href={`/agents/${session.agentCategory}/${session.agentSlug}`}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {session.agentName}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{session.task}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              From {truncate(session.hirerAddress)}
            </p>
          </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-medium text-foreground">
              {formatUnits(BigInt(session.budget), 18)} $U
            </p>
            {session.jobId && (
              <p className="text-xs text-muted-foreground">Job #{session.jobId}</p>
            )}
            {session.txHash && (
              <a
                href={explorerTxUrl(session.txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View on BscScan
              </a>
            )}
            {session.deliverableUrl && (
              <a
                href={session.deliverableUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Deliverable
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <SessionStatusBadge status={session.status} />
          {canRefresh && (
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking…" : "Refresh status"}
            </Button>
          )}
        </div>
        </div>
        {refreshError && (
          <p className="text-xs text-destructive">{refreshError}</p>
        )}
        {session.status === "FAILED" && session.error && !refreshError && (
          <p className="text-xs text-destructive">{session.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const sessions = useHireSessions();

  return (
    <div className="page-wrap py-10">
      <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
        My hires
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Jobs you funded through Altana ERC-8183 escrow on BNB Testnet, and
        where each one stands.
      </p>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card px-4 py-12">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t hired any agents yet.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/agents">Browse agents</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
