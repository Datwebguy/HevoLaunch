import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, Radio } from "lucide-react";

import { getAgent } from "@/lib/8004scan";
import { relativeTimeFrom } from "@/lib/live-agents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface LiveAgentPageProps {
  params: Promise<{ chainId: string; tokenId: string }>;
}

export async function generateMetadata({
  params,
}: LiveAgentPageProps): Promise<Metadata> {
  const { chainId, tokenId } = await params;
  try {
    const agent = await getAgent(Number(chainId), tokenId);
    return {
      title: `${agent.name} — HevoLaunch`,
      description: agent.description,
    };
  } catch {
    return {};
  }
}

/**
 * HevoLaunch's own view of a real, independently-registered 8004scan
 * agent — not one of the curated catalogue listings. Previously this
 * data only appeared as a row that linked straight out to 8004scan.io;
 * every field rendered here (name, description, protocols, score,
 * owner, image) comes from the same `getAgent` call HevoLaunch already
 * makes, so there's no reason to leave the platform to see it. A link
 * to the source page on 8004scan is still offered, just as a secondary
 * "verify it yourself" action rather than the only way to see anything.
 */
export default async function LiveAgentDetailPage({ params }: LiveAgentPageProps) {
  const { chainId, tokenId } = await params;
  const numericChainId = Number(chainId);
  if (!Number.isFinite(numericChainId)) notFound();

  let agent;
  try {
    agent = await getAgent(numericChainId, tokenId);
  } catch {
    notFound();
  }

  const scanUrl = `https://8004scan.io/agents/${chainId}/${tokenId}`;

  return (
    <div className="page-wrap py-10">
      <Link
        href="/agents"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; All agents
      </Link>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Radio className="size-3.5" />
        Live on-chain via 8004scan — not part of HevoLaunch&apos;s curated catalogue
      </div>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {agent.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary, unconfigured remote hosts from live agent registrations
            <img
              src={agent.image_url}
              alt=""
              className="size-12 shrink-0 rounded-md object-cover"
              aria-hidden
            />
          ) : (
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground"
              aria-hidden
            >
              {agent.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold text-balance text-foreground">
                {agent.name}
              </h1>
              {agent.is_verified && (
                <BadgeCheck className="size-5 text-success" aria-label="Verified agent" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Token #{agent.token_id} · registered {relativeTimeFrom(agent.created_at)}
            </p>
          </div>
        </div>

        <a
          href={scanUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          View on 8004scan
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="stat-grid mt-6">
        <div>
          <p className="text-xs text-muted-foreground">8004scan score</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {agent.total_score.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Feedbacks</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {agent.total_feedbacks}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Chain</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {agent.is_testnet ? "BNB Testnet" : "BNB Mainnet"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Agent ID</p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-sm font-medium text-foreground tabular-nums">
            #{agent.token_id}
            <CopyButton value={agent.token_id} />
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="text-sm font-semibold text-foreground">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {agent.description || "No description provided by this agent yet."}
            </p>
          </section>

          {(agent.supported_protocols.length > 0 || agent.x402_supported) && (
            <section>
              <h2 className="text-sm font-semibold text-foreground">Protocols</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.supported_protocols.map((protocol) => (
                  <Badge key={protocol} variant="outline">
                    {protocol}
                  </Badge>
                ))}
                {agent.x402_supported && <Badge variant="outline">x402</Badge>}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-foreground">Identity</h2>
            <Card className="mt-3">
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Owner / wallet</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                    {truncateAddress(agent.owner_address)}
                    <CopyButton value={agent.owner_address} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Identity registry</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                    {truncateAddress(agent.contract_address)}
                    <CopyButton value={agent.contract_address} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-xs text-foreground">
                    eip155:{agent.chain_id} ({agent.is_testnet ? "BNB Testnet" : "BNB Mainnet"})
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <aside>
          <Card>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                This agent registered its identity independently via
                ERC-8004 — it isn&apos;t part of HevoLaunch&apos;s
                hire-ready catalogue, so there&apos;s no fixed price
                (ERC-8183 has the buyer propose a job budget) and hiring
                isn&apos;t wired up for it here yet.
              </p>
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
        </aside>
      </div>
    </div>
  );
}
