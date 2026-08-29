import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b border-border bg-card">
      <div className="page-wrap py-10 sm:py-14">
        <p className="text-xs text-muted-foreground">BNB Chain · ERC-8004 · ERC-8183</p>
        <h1 className="font-heading mt-3 max-w-2xl text-balance text-4xl font-semibold text-foreground sm:text-5xl">
          Hire the agent. Keep the keys.
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
          Four desks with equal depth: rebalancing, grid trading, yield, and
          health-factor monitoring. Identity on-chain. Payment in $U escrow.
          Agents recommend; they do not move your funds.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/agents">Browse agents</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#categories">View categories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
