"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Coins,
  Layers,
  Menu,
  Scale,
  ShieldAlert,
  Terminal,
  TrendingUp,
} from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HevoLogo } from "@/components/brand/hevo-logo";
import { useAccount } from "wagmi";
import { bsc } from "wagmi/chains";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rebalancing: Scale,
  "grid-trading": TrendingUp,
  "yield-optimisation": Coins,
  "health-factor-monitoring": ShieldAlert,
};

export function SiteHeader() {
  const pathname = usePathname();
  const { isConnected, chainId: walletChainId } = useAccount();
  const walletOnBsc = !isConnected || walletChainId === bsc.id;

  const isCategoriesActive = CATEGORIES.some(
    (c) => pathname === `/agents/${c.slug}` || pathname.startsWith(`/agents/${c.slug}/`)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/85 backdrop-blur-md transition-colors">
      <div className="page-wrap flex h-14 items-center justify-between gap-3 sm:gap-6">
        {/* LOGO & DESKTOP NAV */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <HevoLogo size={30} />
            <span className="font-heading text-sm sm:text-base font-semibold tracking-tight text-foreground">
              HevoLaunch
            </span>
            <Badge variant="outline" className="hidden xl:inline-flex text-[10px] font-mono px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
              BNB Chain
            </Badge>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/agents"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap",
                pathname === "/agents"
                  ? "bg-muted font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              All Agents
            </Link>

            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap outline-none",
                    isCategoriesActive
                      ? "bg-muted font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span>Categories</span>
                  <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-md">
                <DropdownMenuLabel className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Agent Categories
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] ?? Layers;
                  const active =
                    pathname === `/agents/${cat.slug}` ||
                    pathname.startsWith(`/agents/${cat.slug}/`);
                  return (
                    <DropdownMenuItem key={cat.slug} asChild className="p-0 cursor-pointer focus:bg-transparent">
                      <Link
                        href={`/agents/${cat.slug}`}
                        className={cn(
                          "flex items-start gap-2.5 rounded-md p-2 text-left transition-colors w-full",
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground">
                            {cat.name}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {cat.tagline}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/tasks"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap",
                pathname.startsWith("/tasks")
                  ? "bg-muted font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Task Marketplace
            </Link>

            <Link
              href="/dashboard"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap",
                pathname === "/dashboard"
                  ? "bg-muted font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              My Hires
            </Link>
          </nav>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Network indicator pill */}
          <div
            className={cn(
              "hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium",
              walletOnBsc
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                walletOnBsc ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span>{walletOnBsc ? "BNB Mainnet" : "Switch to BNB"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:inline-flex text-xs font-medium border-border/80 hover:border-primary/50 gap-1.5"
          >
            <Link href="/become-a-provider">
              <Terminal className="size-3.5 text-primary" />
              <span>Provider Guide</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden xl:inline-flex text-xs font-medium gap-1.5"
          >
            <Link href="/register">Register agent</Link>
          </Button>

          <ConnectWalletButton />
          <ThemeToggle />

          {/* MOBILE MENU SHEET */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 md:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-card border-border flex flex-col justify-between p-6">
              <div>
                <SheetHeader className="pb-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <HevoLogo size={26} />
                    <span className="font-heading font-semibold text-foreground">HevoLaunch</span>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-primary/30 text-primary bg-primary/5 ml-auto">
                      BNB Chain
                    </Badge>
                  </SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-4">
                  {/* Primary Nav Links */}
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/agents"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/agents"
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      All Agents
                    </Link>
                    <Link
                      href="/tasks"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname.startsWith("/tasks")
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      Task Marketplace
                    </Link>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/dashboard"
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      My Hires
                    </Link>
                  </div>

                  {/* Categories Section */}
                  <div className="pt-3 border-t border-border">
                    <p className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      Categories
                    </p>
                    <div className="flex flex-col gap-1">
                      {CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.slug] ?? Layers;
                        const active =
                          pathname === `/agents/${cat.slug}` ||
                          pathname.startsWith(`/agents/${cat.slug}/`);
                        return (
                          <Link
                            key={cat.slug}
                            href={`/agents/${cat.slug}`}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                              active
                                ? "bg-muted font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                              <Icon className="size-3" />
                            </div>
                            <span>{cat.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-col gap-2.5">
                <Button variant="outline" asChild className="w-full justify-start gap-2 text-xs">
                  <Link href="/become-a-provider">
                    <Terminal className="size-3.5 text-primary" />
                    Provider Guide
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
