import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, ExternalLink } from "lucide-react";

import { getCategory } from "@/lib/categories";
import { AGENTS, enrichAgent, getAgentBySlug, getAgentsByCategory } from "@/lib/agents";
import { buildRegistrationRecord, getIdentityRegistryAddress, IDENTITY_CHAIN_ID } from "@/lib/erc8004";
import { scanAgentUrl } from "@/lib/8004scan";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { AgentCard } from "@/components/agents/agent-card";
import { HireButton } from "@/components/hiring/hire-button";
import { EndpointCallDialog } from "@/components/agents/endpoint-call-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface AgentPageProps {
  params: Promise<{ category: string; agentId: string }>;
}

export const revalidate = 300;

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

  const listed = getAgentBySlug(category.slug, agentId);
  if (!listed) notFound();

  const agent = await enrichAgent(listed);
  const record = buildRegistrationRecord(agent);
  const scanUrl = scanAgentUrl(agent.identityChainId, agent.agentId);
  const similarAgents = await Promise.all(
    getAgentsByCategory(category.slug)
      .filter((a) => a.id !== agent.id)
      .slice(0, 3)
      .map(enrichAgent)
  );

  return (
    <div className="page-wrap py-10">
      <Link
        href={`/agents/${category.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {category.name}
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-black"
            style={{ backgroundColor: agent.avatarColor }}
            aria-hidden
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold text-balance text-foreground">
                {agent.name}
              </h1>
              {agent.verified && (
                <BadgeCheck className="size-5 text-success" aria-label="Verified agent" />
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

        <div className="flex shrink-0 gap-2">
          <EndpointCallDialog agent={agent} />
          <HireButton agent={agent} />
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

      <div className="stat-grid mt-6">
        <div>
          <p className="text-xs text-muted-foreground">8004scan score</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {agent.reputation.rating.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Feedbacks</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {agent.reputation.reviewCount}
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
          <p className="text-xs text-muted-foreground">On-chain data</p>
          <a
            href={scanUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            8004scan
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
                <h2 className="text-sm font-semibold text-foreground">Endpoint Status</h2>
                <Card className="mt-3">
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Endpoint health</span>
                      <Badge variant={agent.endpointStatus === "healthy" ? "default" : agent.endpointStatus === "unhealthy" ? "destructive" : "secondary"}>
                        {agent.endpointStatus}
                      </Badge>
                    </div>
                    {agent.a2aEndpoint && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">A2A endpoint</span>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                          {agent.a2aEndpoint.slice(0, 20)}...
                          <CopyButton value={agent.a2aEndpoint} />
                        </span>
                      </div>
                    )}
                    {agent.endpointProtocol && agent.endpointProtocol !== "unknown" && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Protocol</span>
                        <Badge variant="outline">{agent.endpointProtocol.toUpperCase()}</Badge>
                      </div>
                    )}
                    {agent.x402Supported && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">x402 payments</span>
                        <Badge variant="default">Supported</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                        eip155:{agent.identityChainId ?? IDENTITY_CHAIN_ID} (BNB Testnet)
                      </span>
                    </div>
                    {agent.onChainName && agent.onChainName !== agent.name && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">On-chain name</span>
                        <span className="text-xs text-foreground">{agent.onChainName}</span>
                      </div>
                    )}

                    <Separator />

                    <details className="group/details">
                      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                        <span className="transition-transform group-open/details:rotate-90">
                          ▸
                        </span>
                        View assembled registration record
                      </summary>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Built from this listing, not a live tokenURI read. Verify the
                        source record on 8004scan.
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[11px] text-foreground">
{JSON.stringify(record, null, 2)}
                      </pre>
                    </details>

                    <a
                      href={scanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Verify on 8004scan
                      <ExternalLink className="size-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="rounded-lg border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
                No reviews yet. This agent is newly registered.
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="rounded-lg border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
                No activity yet. This agent hasn&apos;t completed a job.
              </div>
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
                <span className="text-muted-foreground">8004scan feedbacks</span>
                <span className="font-medium text-foreground">
                  {agent.reputation.reviewCount}
                </span>
              </div>

              <div className="space-y-2">
                <EndpointCallDialog agent={agent} />
                <HireButton agent={agent} />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                Jobs escrowed in $U via Altana&apos;s ERC-8183 rail • Direct calls via x402
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
