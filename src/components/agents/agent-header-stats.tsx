"use client";

import { ExternalLink } from "lucide-react";
import type { Agent } from "@/lib/types";
import { useAgentReviews } from "@/lib/agent-reviews";
import { CopyButton } from "@/components/ui/copy-button";

interface AgentHeaderStatsProps {
  agent: Agent;
  scanUrl: string;
}

export function AgentHeaderStats({ agent, scanUrl }: AgentHeaderStatsProps) {
  const reviews = useAgentReviews(agent);
  const totalFeedbacks = Math.max(reviews.length, agent.reputation.reviewCount || 0);
  const hasScore = agent.dataSource === "8004scan" && agent.verified;
  const updatedLabel = agent.dataUpdatedAt
    ? new Date(agent.dataUpdatedAt).toLocaleString()
    : "Unavailable";

  return (
    <div className="stat-grid mt-6">
      <div>
        <p className="text-xs text-muted-foreground">8004scan score</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
          {hasScore ? agent.reputation.rating.toFixed(1) : "Unavailable"}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Feedbacks</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
          {agent.dataSource === "8004scan" ? totalFeedbacks : "Unavailable"}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Agent ID</p>
        <p className="mt-0.5 flex items-center gap-1 font-mono text-sm font-medium text-foreground tabular-nums">
          #{agent.agentId}
          <CopyButton value={String(agent.agentId)} />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Data provenance</p>
        <a
          href={scanUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          8004scan
          <ExternalLink className="size-3" />
        </a>
        <p className="mt-1 text-[10px] text-muted-foreground">Updated: {updatedLabel}</p>
      </div>
    </div>
  );
}
