import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Radio, Search } from "lucide-react";

import { CATEGORY_SLUGS, getCategory } from "@/lib/categories";
import { enrichAgent, getAgentsByCategory } from "@/lib/agents";
import { getLiveAgentsForCategory } from "@/lib/live-agents";
import { AgentCard } from "@/components/agents/agent-card";
import { LiveAgentCard } from "@/components/agents/live-agent-card";
import { EmptyAgentsState } from "@/components/agents/empty-agents-state";

/**
 * Single template for all 4 mandatory categories (Rebalancing, Grid
 * Trading, Yield Optimisation, Health Factor Monitoring). Using one
 * dynamic route instead of 4 hand-built pages guarantees every category
 * gets identical layout, sorting, and treatment — there is no code path
 * for one category to end up more built-out than another.
 *
 * Two data sources render side by side: HevoLaunch's own catalogue of
 * real, deployed, ERC-8004-registered agents (see lib/deployed-agents.ts —
 * empty until an agent actually goes live in that category) and a live
 * section of agents registered on BNB Chain mainnet via 8004scan (see
 * lib/live-agents.ts). ISR revalidates the live section every 5 minutes
 * rather than fetching per visitor.
 */

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string }>;
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
    title: `${category.name} Agents | HevoLaunch`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: slug } = await params;
  const { q } = await searchParams;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const agents = await Promise.all(getAgentsByCategory(category.slug).map(enrichAgent));
  const live = await getLiveAgentsForCategory(category, q);

  return (
    <div className="page-wrap py-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {category.description}
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          {agents.length} hire-ready agent{agents.length === 1 ? "" : "s"}
        </div>
      </div>

      {agents.length > 0 ? (
        <div className="mt-8 space-y-2">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyAgentsState categoryName={category.name} />
        </div>
      )}

      {live.failed ? (
        <section className="mt-12 rounded-lg border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
          Could not reach 8004scan just now. Hire-ready listings above are
          unaffected. Retry this page in a minute for the live registry.
        </section>
      ) : (
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Also live on BNB Chain
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {live.qualified} qualified of {live.scanned} scanned
              {live.total > 0 ? ` · ${live.total.toLocaleString()} on 8004scan` : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Mainnet only. We drop placeholder names, gibberish listings, missing
            descriptions, and agents with no A2A/MCP endpoint. 8004scan indexes
            everything; HevoLaunch does not.
          </p>

          <form method="GET" className="relative mt-4 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search all live agents on 8004scan"
              className="h-9 w-full rounded-md border border-border bg-card py-1 pr-2.5 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
            />
          </form>

          {live.agents.length > 0 ? (
            <div className="mt-6 space-y-2">
              {live.agents.map((agent) => (
                <LiveAgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
              No live agents match{q?.trim() ? ` "${q.trim()}"` : " this category"} on-chain yet.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
