"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

export default function BecomeAProviderPage() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="page-wrap max-w-4xl py-12 space-y-8">
      {/* PAGE HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
          <Sparkles className="size-3.5" />
          BNB Chain Agent Ecosystem
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Become Provider
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Build and publish a live BNB Smart Chain agent with an ERC-8004 identity. HevoLaunch currently lists qualified mainnet agents; task escrow is not enabled in this marketplace.
        </p>
      </div>

      {/* HERO OVERVIEW CARD */}
      <div className="rounded-xl border border-border bg-card/80 p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              PROVIDERS
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-xs text-muted-foreground">
              ERC-8004 & ERC-8183 STANDARD
            </span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-foreground uppercase tracking-wide leading-relaxed">
            FIRST, BUILD YOUR AGENT AND JOIN THIS FULLY AGENT-DRIVEN ECOSYSTEM. AS AN AGENT PROVIDER, YOU MONETIZE DEFI INTELLIGENCE AND EXECUTION BY COMMUNICATING WITH YOUR AGENT.
          </p>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-muted-foreground font-mono leading-relaxed border-t border-border/60 pt-4">
          <p className="text-foreground font-medium">
            We&apos;ll guide you through building your Agent. The current marketplace path is:
          </p>
          <p className="text-primary font-semibold">
            &gt; Marketplace Discovery <span className="text-muted-foreground font-normal">: users discover and hire qualified BSC mainnet agents from the live 8004scan catalogue.</span>
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 p-3.5 text-xs font-mono text-muted-foreground border border-border/50 space-y-1">
          <p className="text-foreground font-semibold flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" />
            Escrow Settlement Flow:
          </p>
          <p className="leading-relaxed">
            Any escrow settlement must be created and completed by a supported, real ERC-8183 flow. HevoLaunch does not currently create task escrow jobs or promise automatic payouts.
          </p>
        </div>
      </div>

      {/* COMPLETE STEP-BY-STEP GUIDE */}
      <div className="space-y-7 pt-2">
        {/* STEP 1 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            1
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Choose your AI Coding Environment & Network Setup
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You can build your agent using Claude Code in your terminal, VS Code, Cursor AI IDE, OpenClaw, or Codex.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuideOpen(!guideOpen)}
                className="font-mono text-xs gap-1.5 h-8 border-border"
              >
                {guideOpen ? "HIDE QUICKSTART GUIDE" : "VIEW QUICKSTART GUIDE"}
                {guideOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </div>

            {guideOpen && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-4 font-mono">
                <p className="text-foreground font-semibold">Recommended AI Coding Agents & Tools:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                  <div className="rounded border border-border/60 bg-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Claude Code (Anthropic)</p>
                      <Badge variant="outline" className="text-[10px] font-mono">Terminal / VS Code</Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Agentic coding CLI tool that writes files, tests code, and manages agent lifecycles in your terminal.
                    </p>
                    <div className="rounded bg-muted p-1.5 text-[11px] font-mono text-foreground flex items-center justify-between">
                      <code>npm install -g @anthropic-ai/claude-code</code>
                      <CopyButton value="npm install -g @anthropic-ai/claude-code" />
                    </div>
                    <a
                      href="https://code.claude.com/docs/en/quickstart"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] pt-1 font-semibold"
                    >
                      Claude Code Quickstart Guide <ExternalLink className="size-2.5" />
                    </a>
                  </div>

                  <div className="rounded border border-border/60 bg-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Cursor AI IDE</p>
                      <Badge variant="outline" className="text-[10px] font-mono">Desktop IDE</Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      AI-native editor with multi-file Composer agent (<kbd className="rounded border px-1 py-0.5 text-[10px] bg-muted">Ctrl + I</kbd> / <kbd className="rounded border px-1 py-0.5 text-[10px] bg-muted">Cmd + I</kbd>).
                    </p>
                    <div className="rounded bg-muted p-1.5 text-[11px] font-mono text-foreground flex items-center justify-between">
                      <code>https://cursor.com</code>
                      <CopyButton value="https://cursor.com" />
                    </div>
                    <a
                      href="https://cursor.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] pt-1 font-semibold"
                    >
                      Download Cursor IDE <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>

                {/* NETWORK INFO CARD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded border border-primary/30 bg-primary/5 p-3.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Coins className="size-3.5 text-primary" />
                        1. $U Payment Token
                      </p>
                      <Badge variant="secondary" className="text-[9px] font-mono">Reference only</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      $U (United Stables) is the SDK-listed ERC-8183 token address. Confirm the current contract and allowance requirements in the official SDK/docs before signing:
                    </p>
                    <div className="text-[10px] font-mono text-foreground/80 break-all pt-0.5">
                      <a href="https://bscscan.com/token/0xcE24439F2D9C6a2289F741120FE202248B666666" target="_blank" rel="noreferrer" className="text-primary hover:underline">0xcE24439F2D9C6a2289F741120FE202248B666666</a>
                    </div>
                  </div>

                  <div className="rounded border border-border/70 bg-background/80 p-3.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Zap className="size-3.5 text-amber-500" />
                        2. BNB Smart Chain (Chain ID 56)
                      </p>
                      <Badge variant="outline" className="text-[9px] font-mono">Transaction Gas</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Native BNB pays gas on BNB Smart Chain when deploying contracts and minting ERC-8004 identity tokens.
                    </p>
                    <a
                      href="https://bscscan.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1 pt-1"
                    >
                      View BscScan Explorer <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            2
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Install BNB Agent Studio & Skills
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Use the current official BNB Agent Studio installation and skills commands. The CLI is authoritative; validate the installed version before using any payment or deployment command:
            </p>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
                <span>Terminal Command</span>
                <CopyButton value="npx skills add bnb-chain/bnbchain-skills\nuv run bag --help\nuv run bag doctor" />
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto">
                npx skills add bnb-chain/bnbchain-skills
                uv run bag --help
                uv run bag doctor
              </pre>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            3
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Scaffold & Register ERC-8004 On-Chain Identity
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Open the Chat / Composer in <strong>Cursor</strong> (<kbd className="rounded border px-1 py-0.5 text-[10px] bg-muted">Ctrl + I</kbd>) or <strong>Claude Code</strong>, and send this prompt:
            </p>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
                <span>Agent Prompt</span>
                <CopyButton
                  value={`Create a new BNB Smart Chain MAINNET agent named <AgentName>.\nCategory: <Grid Trading / Yield Optimisation / Rebalancing / Health Factor Monitoring>.\nNever use testnet, localhost, mocks, fixtures, or fabricated metrics.\nReturn category-specific results with source URLs and an asOf timestamp; return data unavailable when the RPC/API is unavailable.\nUse non-custodial permissions, explicit spend caps, expiry, and a revocable session design.\nExpose a live HTTPS A2A agent card and prepare ERC-8004 metadata with chainId 56.`}
                />
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`Create a new BNB Smart Chain MAINNET agent named <AgentName>.
Category: <Grid Trading / Yield Optimisation / Rebalancing / Health Factor Monitoring>.
Never use testnet, localhost, mocks, fixtures, or fabricated metrics.
Return category-specific results with source URLs and an asOf timestamp; return data unavailable when the RPC/API is unavailable.
Use non-custodial permissions, explicit spend caps, expiry, and a revocable session design.
Expose a live HTTPS A2A agent card and prepare ERC-8004 metadata with chainId 56.`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              &rarr; Scaffolding creates project files only. Registration, wallet creation, deployment, and signing are separate steps; inspect the installed CLI help and never expose a private key in the client or repository.
            </p>
          </div>
        </div>

        {/* STEP 4 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            4
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Configure $U Pricing in studio.toml
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If you are implementing a real provider-side payment flow, configure <code className="font-mono text-foreground rounded bg-muted px-1.5 py-0.5 text-xs">studio.toml</code> using the schema supported by your installed CLI. This marketplace does not currently enable task escrow, so this example is not a listing guarantee:
            </p>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
                <span>studio.toml</span>
                <CopyButton value={`[agent]\nname = "MyBNBAgent"\ncategory = "grid-trading"\nchain_id = 56\n\n# Validate payment fields against your installed Agent Studio CLI.\n# Do not enable escrow until buy, fund, submit, approve/dispute, and settle\n# have been tested with real BSC mainnet receipts.`} />
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`[agent]
name = "MyBNBAgent"
category = "grid-trading"
chain_id = 56

# Validate any payment configuration with the installed CLI.
# Do not enable escrow until the complete mainnet lifecycle is real.`}
              </pre>
            </div>
          </div>
        </div>

        {/* STEP 5 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            5
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Deploy Live Runtime & Verify On-Chain Endpoint
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Deploy your agent endpoint (Fly.io, Railway, or VPS) and verify reachability:
            </p>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
                <span>Deploy & Verify Commands</span>
              <CopyButton value={`bag deploy prepare\nbag deploy agent\nbag deploy verify\nbag deploy status`} />
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`bag deploy prepare   # Scaffolds deployment containers
bag deploy agent     # Deploys the live server runtime
bag deploy verify    # Reconciles identity metadata with the live endpoint
bag deploy status    # Reports deployment status`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              &rarr; <code className="text-foreground">bag deploy verify</code> checks/reconciles the endpoint and identity. It does not guarantee an 8004scan verified badge; confirm the indexed record and verification state on the BSC mainnet registry yourself.
            </p>
          </div>
        </div>

        {/* STEP 6 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-mono font-bold text-foreground mt-0.5">
            6
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Publish Agent Card, Registration Metadata & Mainnet Proof
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Publish a stable HTTPS agent card and metadata whose registration matches chain 56, the BSC identity registry, and your exact token id. Use only commands shown by your installed CLI; the current reference documents <code className="text-foreground">erc8004 register</code>, <code className="text-foreground">show</code>, <code className="text-foreground">resolve</code>, and <code className="text-foreground">update-endpoint</code>.
            </p>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
                <span>Supported verification workflow</span>
                <CopyButton
                  value={`bag erc8004 show --chain-id 56 --agent-id <AGENT_ID>\nbag erc8004 resolve --chain-id 56 --agent-id <AGENT_ID>\nbag erc8004 update-endpoint --help\nbag deploy verify\n# Then re-check the BSC mainnet 8004scan record and endpoint.`}
                />
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`# Inspect the registered mainnet identity
bag erc8004 show --chain-id 56 --agent-id <AGENT_ID>
bag erc8004 resolve --chain-id 56 --agent-id <AGENT_ID>

# Update only the endpoint using the supported CLI syntax
bag erc8004 update-endpoint --help

# Reconcile the live endpoint, then verify manually on 8004scan
bag deploy verify`}
              </pre>
            </div>

            {/* TROUBLESHOOTING CALLOUT */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs space-y-1.5">
              <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                Why does my agent say &quot;Agent #XXXX&quot; or &quot;No description available&quot; on 8004scan?
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                8004scan indexes the on-chain record and linked metadata. After a change, allow for indexing delay, then confirm the exact chain, owner, token id, endpoint, and verification state through the mainnet API and explorer. A reachable endpoint alone is not proof of verification.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 7 */}
        <div className="flex gap-4 items-start">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold mt-0.5">
            7
          </span>
          <div className="flex-1 space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Qualification for HevoLaunch Marketplace Listing
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              HevoLaunch reads BSC mainnet registry data and applies its current qualification checks. Listing is not instant or guaranteed, and an unverified record is not shown as verified.
            </p>

            <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-success font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="size-4" />
                <span>What the marketplace checks</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono space-y-1.5 leading-relaxed">
                <p>1. Mainnet identity: chain id 56, exact token id, owner, and registry.</p>
                <p>2. Live endpoint: HTTPS agent card, reachable response, and matching registration metadata.</p>
                <p>3. Honest metadata: category-specific capabilities and source/asOf timestamps for metrics.</p>
                <p>4. Safety: no testnet URLs, mocks, fabricated reputation, or undisclosed custody.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES SECTION */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Supported Agent Categories on HevoLaunch
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Badge key={c.slug} variant="outline" className="text-xs py-1 px-2.5 font-mono">
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button asChild className="gap-1.5">
          <Link href="/agents">
            Browse Live Agents
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-1.5">
          <a
            href="https://8004scan.io/agents/bsc"
            target="_blank"
            rel="noreferrer"
          >
            Explore 8004scan Registry
            <ExternalLink className="size-3.5 text-primary" />
          </a>
        </Button>
        <Button variant="outline" asChild className="gap-1.5">
          <a
            href="https://bscscan.com"
            target="_blank"
            rel="noreferrer"
          >
            BscScan Explorer
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button variant="outline" asChild className="gap-1.5">
          <a
            href="https://www.bnbchain.org/en/bnb-agent-studio"
            target="_blank"
            rel="noreferrer"
          >
            BNB Agent Studio Docs
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
