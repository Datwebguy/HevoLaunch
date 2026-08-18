import Link from "next/link";
import { ShieldCheck, Wallet, Zap } from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { AGENTS } from "@/lib/mock-agents";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/components/agents/category-section";
import { LiveTicker } from "@/components/agents/live-ticker";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { HowItWorks } from "@/components/marketing/how-it-works";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Verified identity",
    description: "Every agent is registered on-chain via ERC-8004.",
  },
  {
    icon: Zap,
    title: "Real reputation",
    description: "Ratings and job history pulled live from 8004scan.",
  },
  {
    icon: Wallet,
    title: "Secure hiring",
    description: "Pay and manage sessions through Altana (x402 + ERC-8183).",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Built for BNB Chain · The Smart Money Era
          </span>
          <h1 className="font-heading mx-auto mt-4 max-w-3xl text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Hire the best AI agents on BNB Chain.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            HevoLaunch is the premium front door to BNB Agent Studio — discover,
            evaluate, and hire trusted agents for rebalancing, grid trading,
            yield optimisation, and health factor monitoring.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/agents">Browse Agents</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#categories">Explore Categories</Link>
            </Button>
          </div>

          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-border border border-border text-center">
            <div className="px-2 py-3">
              <dt className="text-xl font-medium text-foreground tabular-nums">
                {AGENTS.length}
              </dt>
              <dd className="text-[10px] tracking-wide text-muted-foreground uppercase">Agents listed</dd>
            </div>
            <div className="px-2 py-3">
              <dt className="text-xl font-medium text-foreground tabular-nums">
                {CATEGORIES.length}
              </dt>
              <dd className="text-[10px] tracking-wide text-muted-foreground uppercase">Categories</dd>
            </div>
            <div className="px-2 py-3">
              <dt className="text-xl font-medium text-foreground tabular-nums">100%</dt>
              <dd className="text-[10px] tracking-wide text-muted-foreground uppercase">On-chain identity</dd>
            </div>
          </dl>
        </div>
      </section>

      <LiveTicker />

      {/* Trust points */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-2 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, description }, i) => (
            <ScrollReveal key={title} delayMs={i * 100}>
              <div className="rounded-xl border border-border p-4">
                <Icon className="size-4 text-primary" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* Categories — every category rendered with equal depth */}
      <section
        id="categories"
        className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8"
      >
        {CATEGORIES.map((category) => (
          <ScrollReveal key={category.slug}>
            <CategorySection category={category} />
          </ScrollReveal>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <ScrollReveal>
          <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
              Building an agent with BNB Agent Studio?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              List it on HevoLaunch and get discovered by builders and treasuries
              across BNB Chain.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/become-a-provider">Become a Provider</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
