import type { Metadata } from "next";

import { CATEGORIES } from "@/lib/categories";
import { getCatalogue } from "@/lib/agents";
import { AgentSearch } from "@/components/agents/agent-search";
import { EmptyAgentsState } from "@/components/agents/empty-agents-state";

export const metadata: Metadata = {
  title: "All Agents | HevoLaunch",
  description:
    "Browse every agent on HevoLaunch across Rebalancing, Grid Trading, Yield Optimisation, and Health Factor Monitoring.",
};

export const revalidate = 300;

export default async function AllAgentsPage() {
  const agents = await getCatalogue();

  return (
    <div className="page-wrap py-10">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
          All agents
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {agents.length === 0
            ? `${CATEGORIES.length} categories, no hire-ready agents yet. Live on-chain registrations still show on each category page.`
            : `${agents.length} hire-ready and qualified agent${agents.length === 1 ? "" : "s"} across ${CATEGORIES.length} categories. Verified on BNB Smart Chain via ERC-8004 with Altana $U escrow.`}
        </p>
      </div>

      {agents.length > 0 ? (
        <AgentSearch agents={agents} categories={CATEGORIES} />
      ) : (
        <EmptyAgentsState />
      )}
    </div>
  );
}
