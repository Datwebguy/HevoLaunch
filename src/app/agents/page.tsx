import type { Metadata } from "next";
import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { AGENTS, getAgentsByCategory } from "@/lib/mock-agents";
import { AgentCard } from "@/components/agents/agent-card";

export const metadata: Metadata = {
  title: "All Agents — HevoLaunch",
  description:
    "Browse every agent on HevoLaunch across Rebalancing, Grid Trading, Yield Optimisation, and Health Factor Monitoring.",
};

export default function AllAgentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground">
          All Agents
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {AGENTS.length} agents across {CATEGORIES.length} categories, all
          built with BNB Agent Studio and identified on-chain via ERC-8004.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/agents/${c.slug}`}
            className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground/80 hover:border-primary/40 hover:text-foreground"
          >
            {c.name}
            <span className="ml-1.5 text-muted-foreground">
              {getAgentsByCategory(c.slug).length}
            </span>
          </Link>
        ))}
      </div>

      <div className="space-y-16">
        {CATEGORIES.map((category) => {
          const agents = getAgentsByCategory(category.slug);
          return (
            <section key={category.slug} id={category.slug} className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-medium tracking-tight text-foreground">
                  {category.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
