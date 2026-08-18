"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { PlayCircle } from "lucide-react";

import { useHireSessions, saveSession } from "@/lib/hire-sessions";
import { simulateAgentProgress } from "@/lib/altana";
import type { HireSession } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function SessionRow({ session }: { session: HireSession }) {
  const [advancing, setAdvancing] = useState(false);
  const canAdvance = session.status === "FUNDED" || session.status === "SUBMITTED";

  async function handleAdvance() {
    setAdvancing(true);
    await simulateAgentProgress(session, (update) => saveSession(update));
    setAdvancing(false);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
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
          </div>
          <SessionStatusBadge status={session.status} />
          {canAdvance && (
            <Button size="sm" variant="outline" onClick={handleAdvance} disabled={advancing}>
              <PlayCircle className="size-3.5" />
              {advancing ? "Working..." : "Simulate progress"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const sessions = useHireSessions();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground">
        My Agents
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Jobs you&apos;ve funded through Altana&apos;s ERC-8183 escrow, and where
        each one stands.
      </p>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t hired any agents yet.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/agents">Browse Agents</Link>
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
