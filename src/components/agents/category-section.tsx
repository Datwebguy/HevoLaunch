import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { memo } from "react";

import type { CategoryShelf } from "@/lib/agents";
import { AgentCard } from "@/components/agents/agent-card";
import { LiveAgentCard } from "@/components/agents/live-agent-card";
import { EmptyAgentsState } from "@/components/agents/empty-agents-state";

export const CategorySection = memo(function CategorySection({ shelf }: { shelf: CategoryShelf }) {
  const { category, curated, live } = shelf;

  return (
    <section className="flex h-full min-h-52 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground">
            {category.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{category.tagline}</p>
        </div>
        <Link
          href={`/agents/${category.slug}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {curated.length > 0 && (
          <div className="divide-y divide-border rounded-md border border-border">
            {curated.map((agent) => (
              <AgentCard key={agent.id} agent={agent} flush />
            ))}
          </div>
        )}

        {live && !live.failed && live.agents.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="font-mono uppercase tracking-wider text-[10px]">
                Qualified Registry Agents
              </span>
              <span>{live.qualified} verified</span>
            </div>
            <div className="divide-y divide-border rounded-md border border-border/70 bg-card/50">
              {live.agents.slice(0, 2).map((agent) => (
                <LiveAgentCard key={agent.id} agent={agent} flush />
              ))}
            </div>
          </div>
        )}

        {curated.length === 0 && (!live || live.failed || live.agents.length === 0) && (
          <EmptyAgentsState categoryName={category.name} flush />
        )}
      </div>
    </section>
  );
});
