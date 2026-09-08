import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import { memo } from "react";

import type { Agent } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { cn } from "@/lib/utils";

function formatPrice(agent: Agent) {
  const { amount, currency, cadence } = agent.pricing;
  if (agent.pricing.model === "performance-fee") {
    return `${amount}${cadence}`;
  }
  return `${amount} ${currency}`;
}

export const AgentCard = memo(function AgentCard({
  agent,
  flush = false,
}: {
  agent: Agent;
  flush?: boolean;
}) {
  const category = CATEGORY_MAP[agent.category];
  const scoreLabel =
    agent.reputation.reviewCount === 0 && agent.reputation.rating === 0
      ? "N/A"
      : agent.reputation.rating.toFixed(1);

  const href = agent.id.startsWith("live-")
    ? `/agents/live/${agent.identityChainId || 56}/${agent.agentId}`
    : `/agents/${agent.category}/${agent.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "market-row px-3 py-3 hover:bg-muted",
        !flush && "rounded-lg border border-border bg-card"
      )}
    >
      <span
        className="flex size-10 items-center justify-center rounded-md text-xs font-semibold text-primary-foreground"
        style={{ backgroundColor: agent.avatarColor }}
        aria-hidden
      >
        {agent.name.slice(0, 2).toUpperCase()}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground shrink-0">{agent.name}</h3>
          {agent.featured ? (
            <span className="rounded bg-primary/15 text-primary text-[10px] font-medium px-1.5 py-0.5 shrink-0">
              Flagship
            </span>
          ) : (
            <span className="rounded bg-muted text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 shrink-0">
              #{agent.agentId}
            </span>
          )}
          {agent.verified && (
            <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified agent" />
          )}
          {agent.endpointStatus === "coming-soon" && (
            <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Coming soon" />
          )}
          {!flush && (
            <span className="hidden sm:inline shrink-0 text-xs text-muted-foreground">{category?.shortName}</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.tagline}</p>
      </div>

      <span className="hidden font-mono text-xs tabular-nums text-foreground sm:block">{scoreLabel}</span>
      <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:block">
        {agent.reputation.reviewCount} fb
      </span>
      <span className="text-right font-mono text-xs font-medium tabular-nums text-foreground">
        {formatPrice(agent)}
      </span>
    </Link>
  );
});
