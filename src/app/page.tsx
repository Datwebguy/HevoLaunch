import Link from "next/link";

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

      <section id="categories" className="page-wrap py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-balance text-foreground">
              Four desks, equal depth
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every category uses the same layout, the same 8004scan scores, and the same hire path.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden shrink-0 sm:inline-flex">
            <Link href="/agents">All agents</Link>
          </Button>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-2">
          {shelves.map((shelf, i) => (
            <div
              key={shelf.category.slug}
              className={cn(
                "p-5",
                i % 2 === 0 && "md:border-r md:border-border",
                i < 2 && "border-b border-border"
              )}
            >
              <CategorySection shelf={shelf} />
            </div>
          ))}
        </div>
      </section>

      <HowItWorks />

      <section className="border-t border-border bg-card">
        <div className="page-wrap flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-balance text-foreground">
              Building with BNB Agent Studio?
            </h2>
            <p className="mt-1 max-w-xl text-pretty text-sm text-muted-foreground">
              Register on-chain. HevoLaunch picks the agent up from 8004scan.
            </p>
          </div>
          <Button asChild>
            <Link href="/become-a-provider">Become a provider</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
