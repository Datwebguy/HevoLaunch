import type { Metadata } from "next";
import type { CategorySlug } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";

import { getCategory } from "@/lib/categories";
import { AGENTS, enrichAgent, getAgentBySlug, getAgentsByCategory } from "@/lib/agents";
import { getIdentityRegistryAddress } from "@/lib/erc8004";
import { scanAgentUrl } from "@/lib/8004scan";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/ui/copy-button";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentHeaderStats } from "@/components/agents/agent-header-stats";
import { AgentDetailsTabs } from "@/components/agents/agent-details-tabs";
import { HireButton } from "@/components/hiring/hire-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AgentPageProps {
  params: Promise<{
    category: string;
    agentId: string;
  }>;
}

export async function generateStaticParams() {
  return AGENTS.map((agent) => ({
    category: agent.category,
    agentId: agent.slug,
  }));
}

export async function generateMetadata({
  params,
}: AgentPageProps): Promise<Metadata> {
  const { category: categorySlug, agentId: slug } = await params;
  const agent = getAgentBySlug(categorySlug as CategorySlug, slug);
  if (!agent) {
    return { title: "Agent not found — HevoLaunch" };
  }
  return {
    title: `${agent.name} — HevoLaunch`,
    description: agent.tagline,
  };
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { category: categorySlug, agentId: slug } = await params;
  const raw = getAgentBySlug(categorySlug as CategorySlug, slug);
  if (!raw) notFound();

  const category = getCategory(raw.category);
  if (!category) notFound();

  const agent = await enrichAgent(raw);
  const scanUrl = scanAgentUrl(agent.identityChainId ?? 56, agent.agentId);
  const similarAgents = getAgentsByCategory(raw.category).filter(
    (a) => a.id !== agent.id
  );

  return (
    <div className="page-wrap py-10">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/agents" className="hover:text-foreground">
          All agents
        </Link>
        <span>/</span>
        <Link href={`/agents/${category.slug}`} className="hover:text-foreground">
          {category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{agent.name}</span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-primary-foreground shadow-sm"
            style={{ backgroundColor: agent.avatarColor }}
            aria-hidden
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-balance text-foreground">
                {agent.name}
              </h1>
              {agent.verified && (
                <BadgeCheck className="size-5 text-success" aria-label="Verified agent" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
              <Badge variant="secondary" className="font-mono text-xs">{category.name}</Badge>
              <span className="text-muted-foreground/60">&bull;</span>
              <span>{agent.chain}</span>
              <span className="text-muted-foreground/60">&bull;</span>
              <span>Built with {agent.builtWith}</span>
            </div>
          </div>
        </div>
      </div>

      {agent.endpointStatus === "unhealthy" && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle />
          <AlertTitle>Runtime last seen unhealthy</AlertTitle>
          <AlertDescription>
            8004scan reported this agent&apos;s A2A endpoint as down (HTTP 410
            or similar). Hiring still opens an on-chain job; a deliverable
            will not arrive until the seller runtime is redeployed.
          </AlertDescription>
        </Alert>
      )}

      {/* Reactive Header Stats Grid */}
      <AgentHeaderStats agent={agent} scanUrl={scanUrl} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <AgentDetailsTabs
            agent={agent}
            overviewContent={
              <>
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-foreground">About</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {agent.description}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-foreground">Capabilities</h2>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {agent.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs font-mono">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-foreground">Identity & Verification</h2>
                  <Card className="border-border bg-card/80">
                    <CardContent className="space-y-3 text-sm p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Owner / wallet</span>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                          {truncateAddress(agent.agentIdentityAddress)}
                          <CopyButton value={agent.agentIdentityAddress} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Identity registry</span>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                          {truncateAddress(getIdentityRegistryAddress())}
                          <CopyButton value={getIdentityRegistryAddress()} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Network</span>
                        <span className="text-xs text-foreground">
                          BNB Smart Chain
                        </span>
                      </div>
                      {agent.onChainName && agent.onChainName !== agent.name && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">On-chain name</span>
                          <span className="text-xs text-foreground">{agent.onChainName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-muted-foreground">Verification Status</span>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                          <ShieldCheck className="size-3.5" />
                          ERC-8004 Verified
                        </span>
                      </div>

                      <Separator />

                      <a
                        href={scanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
                      >
                        View on 8004scan
                        <ExternalLink className="size-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                </section>
              </>
            }
          />
        </div>

        <aside className="space-y-6">
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pricing</p>
                <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                  {agent.pricing.model === "performance-fee"
                    ? `${agent.pricing.amount}${agent.pricing.cadence}`
                    : `${agent.pricing.amount} ${agent.pricing.currency}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {agent.pricing.model !== "performance-fee" && agent.pricing.cadence}
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-muted-foreground">8004scan feedbacks</span>
                <span className="font-semibold text-foreground">
                  {agent.reputation.reviewCount}
                </span>
              </div>

              <div>
                <HireButton agent={agent} />
              </div>
              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                Non-custodial execution &bull; Funds held securely in $U escrow
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {similarAgents.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            More {category.name} agents
          </h2>
          <div className="mt-4 space-y-2">
            {similarAgents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
