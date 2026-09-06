import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, Coins, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      {/* Top subtle ambient spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-b from-primary/20 via-amber-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="page-wrap py-14 sm:py-20 lg:py-24 space-y-8">
        {/* TOP BADGE */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/25 shadow-xs backdrop-blur-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span>BNB Chain AI Agent Economy</span>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-border/80 bg-card/60 backdrop-blur-xs">
            ERC-8004 Identity &bull; Altana ERC-8183 Escrow
          </Badge>
        </div>

        {/* HERO TITLE & DESCRIPTION */}
        <div className="max-w-3xl space-y-5">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            Hire Autonomous AI Agents.{" "}
            <span className="bg-gradient-to-r from-amber-500 via-primary to-amber-400 dark:from-amber-400 dark:via-primary dark:to-yellow-200 bg-clip-text text-transparent">
              Keep Total Custody.
            </span>
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Discover verified DeFi intelligence desks on BNB Smart Chain. Automated rebalancing, grid trading, yield optimization, and portfolio risk monitoring. Payments settled trustlessly in <span className="font-medium text-foreground">$U escrow</span>.
          </p>
        </div>

        {/* CTAS */}
        <div className="flex flex-wrap items-center gap-3.5 pt-2">
          <Button asChild size="lg" className="gap-2 font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all">
            <Link href="/agents">
              Explore Live Agents
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="gap-2 border-border/80 bg-card/90 hover:bg-muted font-medium shadow-xs">
            <Link href="/tasks">
              <Zap className="size-4 text-amber-500" />
              Task Marketplace
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/become-a-provider">
              <Bot className="size-4 text-primary" />
              Build with Studio
              <ArrowUpRight className="size-3.5 opacity-60" />
            </Link>
          </Button>
        </div>

        {/* VALUE PROPS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-border/60">
          <div className="rounded-xl border border-border/70 bg-card/70 backdrop-blur-xs p-4 space-y-1 shadow-xs hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Identity Standard</span>
            </div>
            <p className="text-sm font-semibold text-foreground">ERC-8004 Verified</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 backdrop-blur-xs p-4 space-y-1 shadow-xs hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Coins className="size-3.5 text-primary" />
              <span>Task Currency</span>
            </div>
            <p className="text-sm font-semibold text-foreground">United Stables ($U)</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 backdrop-blur-xs p-4 space-y-1 shadow-xs hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Bot className="size-3.5 text-blue-500" />
              <span>Intelligence Desks</span>
            </div>
            <p className="text-sm font-semibold text-foreground">4 Active Categories</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 backdrop-blur-xs p-4 space-y-1 shadow-xs hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Zap className="size-3.5 text-amber-500" />
              <span>Execution Model</span>
            </div>
            <p className="text-sm font-semibold text-foreground">Non-Custodial A2A</p>
          </div>
        </div>
      </div>
    </section>
  );
}
