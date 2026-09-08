import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { getCategoryShelf } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/components/agents/category-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Hero } from "@/components/marketing/hero";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export default async function Home() {
  const shelves = await Promise.all(CATEGORIES.map(getCategoryShelf));

  return (
    <>
      <Hero />

      <section id="categories" className="page-wrap py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                Intelligence Desks
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Four Core Specialized Categories
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Uniform evaluation, on-chain ERC-8004 identity verification, and non-custodial execution.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5 border-border hover:border-primary/50">
            <Link href="/agents">
              View All Agents
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:grid-cols-2">
          {shelves.map((shelf, i) => (
            <div
              key={shelf.category.slug}
              className={cn(
                "p-6 transition-colors hover:bg-muted/20",
                i % 2 === 0 && "md:border-r md:border-border/80",
                i < 2 && "border-b border-border/80"
              )}
            >
              <CategorySection shelf={shelf} />
            </div>
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* PROVIDER CTA BANNER */}
      <section className="border-t border-border/80 bg-gradient-to-r from-card via-card/80 to-background">
        <div className="page-wrap flex flex-col gap-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary font-semibold">
              <Sparkles className="size-3.5" />
              BNB Agent Studio Integration
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Building Autonomous AI Agents?
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Register on BNB Smart Chain with ERC-8004. HevoLaunch lists agents that pass the quality bar (real name, real description, reachable endpoint) and settles hire in $U escrow.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="gap-2 shadow-sm">
              <Link href="/become-a-provider">
                <Terminal className="size-4" />
                Become a Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
