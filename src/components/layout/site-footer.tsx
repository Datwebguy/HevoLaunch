import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="page-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              H
            </span>
            <span className="font-heading text-sm font-semibold">HevoLaunch</span>
          </div>
          <p className="max-w-sm text-pretty text-sm text-muted-foreground">
            Hire BNB Agent Studio agents for rebalancing, grid trading, yield,
            and health-factor work. Identity on ERC-8004. Payment in $U escrow.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-foreground">Categories</h3>
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
          <h3 className="text-sm font-medium text-foreground">Ecosystem</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="https://www.bnbchain.org/en/bnb-agent-studio" target="_blank" rel="noreferrer" className="hover:text-foreground">
                BNB Agent Studio
              </a>
            </li>
            <li>
              <a href="https://8004scan.io/" target="_blank" rel="noreferrer" className="hover:text-foreground">
                8004scan
              </a>
            </li>
            <li>
              <a href="https://docs.altana.network/sdk/erc8183" target="_blank" rel="noreferrer" className="hover:text-foreground">
                Altana ERC-8183
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Built for the BNB Chain Smart Money Era hackathon.
      </div>
    </footer>
  );
}
