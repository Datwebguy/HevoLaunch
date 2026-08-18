import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Radio } from "lucide-react";

import { CATEGORY_SLUGS, getCategory } from "@/lib/categories";
import { getAgentsByCategory } from "@/lib/mock-agents";
import { getLiveAgentsForCategory } from "@/lib/live-agents";
import { AgentCard } from "@/components/agents/agent-card";
import { LiveAgentCard } from "@/components/agents/live-agent-card";

/**
 * Single template for all 4 mandatory categories (Rebalancing, Grid
 * Trading, Yield Optimisation, Health Factor Monitoring). Using one
 * dynamic route instead of 4 hand-built pages guarantees every category
 * gets identical layout, sorting, and treatment — there is no code path
 * for one category to end up more built-out than another.
 *
 * Two data sources render side by side: HevoLaunch's own curated catalogue
 * (always present, always the same count per category — this is what
 * keeps "equal depth" true regardless of how much real on-chain data
 * exists yet) and a live section of agents actually registered on BNB
 * Chain mainnet via 8004scan (see lib/live-agents.ts). ISR revalidates
 * the live section every 5 minutes rather than fetching per visitor.
 */

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: `${category.name} Agents — HevoLaunch`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const agents = getAgentsByCategory(category.slug);
  const live = await getLiveAgentsForCategory(category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {category.description}
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          {agents.length} agent{agents.length === 1 ? "" : "s"} available
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {live.agents.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              <h2 className="text-lg font-heading font-medium tracking-tight text-foreground">
                Also live on BNB Chain
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {live.total} registered on-chain via 8004scan
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Real agents registered on mainnet matching this category.
            Reputation here is still building — this whole ecosystem is
            brand new — and hiring these directly isn&apos;t wired up yet,
            so treat this as discovery, not a listing.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {live.agents.map((agent) => (
              <LiveAgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
