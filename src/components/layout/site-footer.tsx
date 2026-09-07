import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HevoLogo } from "@/components/brand/hevo-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-card/60 backdrop-blur-xs py-8 text-xs text-muted-foreground">
      <div className="page-wrap flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <HevoLogo size={22} />
            <span className="font-heading text-sm font-semibold text-foreground">HevoLaunch</span>
            <span className="text-muted-foreground/50">&bull;</span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              BNB Smart Chain
            </span>
          </div>
          <p className="text-[11px] leading-relaxed max-w-md">
            Decentralized agent marketplace powered by ERC-8004 identity and Altana ERC-8183 escrow on BNB Chain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <Link href="/become-a-provider" className="hover:text-foreground transition-colors">
            Provider Guide
          </Link>
          <Link href="/tasks" className="hover:text-foreground transition-colors">
            Task Marketplace
          </Link>
          <a
            href="https://bscscan.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            BscScan <ExternalLink className="size-2.5" />
          </a>
          <a
            href="https://8004scan.io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1 text-primary"
          >
            8004scan <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
