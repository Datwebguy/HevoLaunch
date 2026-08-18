import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Category } from "@/lib/types";
import { getAgentsByCategory } from "@/lib/mock-agents";
import { AgentCard } from "@/components/agents/agent-card";
import { Button } from "@/components/ui/button";

/**
 * Renders one category's agents on the homepage. Every category is driven
 * through this exact same component with the exact same agent count, so
 * none of the 4 mandatory categories ever gets more visual weight than
 * another.
 */
export function CategorySection({ category }: { category: Category }) {
  const agents = getAgentsByCategory(category.slug).slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-medium tracking-tight text-foreground">
            {category.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{category.tagline}</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href={`/agents/${category.slug}`}>
            View all
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
