"use client";

import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { ScanAgent } from "@/lib/8004scan";
import { relativeTimeFrom } from "@/lib/live-agents";
import { cn } from "@/lib/utils";

export function LiveAgentCard({
  agent,
  flush = false,
}: {
  agent: ScanAgent;
  flush?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/agents/live/${agent.chain_id}/${agent.token_id}`}
      className={cn(
        "market-row px-3 py-3 hover:bg-muted",
        !flush && "rounded-lg border border-border bg-card"
      )}
    >
      {agent.image_url && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts from live registrations
        <img
          src={agent.image_url}
          alt=""
          className="size-10 rounded-md object-cover"
          aria-hidden
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="flex size-10 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground"
          aria-hidden
        >
          {agent.name.slice(0, 2).toUpperCase()}
        </span>
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-foreground">{agent.name}</h3>
          {agent.is_verified && (
            <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified agent" />
          )}
          {!agent.is_verified && (
            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">
              Verification pending
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          Token #{agent.token_id} · {relativeTimeFrom(agent.created_at)}
        </p>
      </div>

      <span className="hidden font-mono text-xs tabular-nums text-foreground sm:block">
        {agent.total_score.toFixed(1)}
      </span>
      <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:block">
        {agent.total_feedbacks} fb
      </span>
      <ChevronRight className="ml-auto size-4 text-muted-foreground sm:ml-0 sm:justify-self-end" aria-hidden />
    </Link>
  );
}
