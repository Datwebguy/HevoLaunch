import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, Star } from "lucide-react";

import { getCategory } from "@/lib/categories";
import { AGENTS, getAgentBySlug, getAgentsByCategory } from "@/lib/mock-agents";
import { getAgentActivity, getAgentReviews } from "@/lib/mock-activity";
import { buildRegistrationRecord, getIdentityRegistryAddress, IDENTITY_CHAIN_ID } from "@/lib/erc8004";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { AgentCard } from "@/components/agents/agent-card";
import { HireButton } from "@/components/hiring/hire-button";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface AgentPageProps {
  params: Promise<{ category: string; agentId: string }>;
}

export function generateStaticParams() {
  return AGENTS.map((agent) => ({
    category: agent.category,
    agentId: agent.slug,
  }));
}

export async function generateMetadata({
  params,
}: AgentPageProps): Promise<Metadata> {
  const { category: slug, agentId } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const agent = getAgentBySlug(category.slug, agentId);
  if (!agent) return {};

  return {
    title: `${agent.name} — HevoLaunch`,
    description: agent.tagline,
  };
}

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { category: slug, agentId } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const agent = getAgentBySlug(category.slug, agentId);
  if (!agent) notFound();

  const reviews = getAgentReviews(agent);
  const activity = getAgentActivity(agent);
  const record = buildRegistrationRecord(agent);
  const similarAgents = getAgentsByCategory(category.slug)
    .filter((a) => a.id !== agent.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={`/agents/${category.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {category.name}
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: agent.avatarColor }}
            aria-hidden
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-medium tracking-tight text-foreground">
                {agent.name}
              </h1>
              {agent.verified && (
                <BadgeCheck className="size-5 text-primary" aria-label="Verified agent" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary">{category.name}</Badge>
              <span>{agent.chain}</span>
              <span>Built with {agent.builtWith}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <HireButton agent={agent} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 divide-x divide-border border border-border sm:grid-cols-5">
        <div className="px-3 py-2.5">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Score</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground tabular-nums">
            <Star className="size-3 fill-primary text-primary" />
            {agent.reputation.rating.toFixed(1)}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Jobs</p>
          <p className="mt-0.5 text-sm font-medium text-foreground tabular-nums">
            {agent.reputation.completedJobs.toLocaleString()}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Success</p>
          <p className="mt-0.5 text-sm font-medium text-foreground tabular-nums">
            {agent.reputation.successRate}%
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">Agent ID</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground tabular-nums">
            #{agent.agentId}
            <CopyButton value={String(agent.agentId)} />
          </p>
        </div>
        <div className="col-span-2 px-3 py-2.5 sm:col-span-1">
          <p className="text-[9px] tracking-wide text-muted-foreground uppercase">On-chain data</p>
          <a
            href="https://8004scan.io/"
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                <Badge variant="outline" className="ml-1">
                  {agent.reputation.reviewCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <section>
                <h2 className="text-sm font-semibold text-foreground">About</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {agent.description}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-foreground">Capabilities</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-foreground">Identity</h2>
                <Card className="mt-3">
                  <CardContent className="space-y-3 text-sm">
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
                        eip155:{IDENTITY_CHAIN_ID} (BNB Testnet)
                      </span>
                    </div>

                    <Separator />

                    <details className="group/details">
                      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                        <span className="transition-transform group-open/details:rotate-90">
                          ▸
                        </span>
                        View raw registration record
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[11px] text-foreground">
{JSON.stringify(record, null, 2)}
                      </pre>
                    </details>

                    <a
                      href="https://8004scan.io/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Browse on 8004scan
                      <ExternalLink className="size-3.5" />
                    </a>
                    <p className="text-xs text-muted-foreground">
                      This agent isn&apos;t registered on-chain yet (HevoLaunch
                      demo data) — once minted, its record would resolve at
                      this registry and token id.
                    </p>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {review.reviewerAddress.slice(0, 6)}...{review.reviewerAddress.slice(-4)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {review.relativeTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-[#F0B90B] text-[#F0B90B]" />
                      <span className="font-medium text-foreground">{review.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {activity.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{entry.label}</p>
                      <p className="mt-0.5 text-muted-foreground">{entry.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {entry.relativeTime}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Pricing</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {agent.pricing.model === "performance-fee"
                    ? `${agent.pricing.amount}${agent.pricing.cadence}`
                    : `${agent.pricing.amount} ${agent.pricing.currency}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {agent.pricing.model !== "performance-fee" && agent.pricing.cadence}
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium text-foreground">
                  {agent.reputation.reviewCount}
                </span>
              </div>

              <HireButton agent={agent} />
              <p className="text-center text-[11px] text-muted-foreground">
                Escrowed in $U via Altana&apos;s ERC-8183 job rail
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {similarAgents.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-heading font-medium tracking-tight text-foreground">
            More {category.name} agents
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarAgents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
