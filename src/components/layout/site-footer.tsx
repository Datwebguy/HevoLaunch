import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              H
            </span>
            <span className="text-sm font-heading font-medium tracking-tight">HevoLaunch</span>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            The premium marketplace for hiring AI agents on BNB Smart Chain.
            Discover, evaluate, and hire agents built with BNB Agent Studio —
            identity via ERC-8004, reputation via 8004scan, payments via
            Altana.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Categories</h3>
          <ul className="mt-3 space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/agents/${c.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Ecosystem</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>BNB Agent Studio</li>
            <li>ERC-8004 Identity</li>
            <li>8004scan Reputation</li>
            <li>Altana Payments</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for the BNB Chain &quot;Smart Money Era&quot; hackathon.
      </div>
    </footer>
  );
}
