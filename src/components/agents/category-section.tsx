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

      <div className="mt-4 flex-1">
        {curated.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {curated.slice(0, 3).map((agent) => (
              <AgentCard key={agent.id} agent={agent} flush />
            ))}
          </div>
        ) : live && !live.failed && live.agents.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              No hire-ready Hevo agent on mainnet yet. Qualified live registrations only.
            </p>
            <div className="divide-y divide-border rounded-md border border-border">
              {live.agents.slice(0, 2).map((agent) => (
                <LiveAgentCard key={agent.id} agent={agent} flush />
              ))}
            </div>
          </div>
        ) : (
          <EmptyAgentsState categoryName={category.name} flush />
        )}
      </div>
    </section>
  );
});
