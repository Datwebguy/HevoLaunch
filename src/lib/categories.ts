import type { Category, CategorySlug } from "@/lib/types";

/**
 * The 4 mandatory categories, defined in a single source of truth so every
 * page (homepage, nav, category grid, category route) renders them with
 * identical structure and depth — no category gets special treatment.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "rebalancing",
    name: "Rebalancing",
    shortName: "Rebalancing",
    description:
      "Agents that keep a wallet or vault's asset allocation aligned to a target, automatically trading as prices drift.",
    tagline: "Keep your portfolio balanced, automatically.",
    discoveryQuery: "rebalanc",
  },
  {
    slug: "grid-trading",
    name: "Grid Trading",
    shortName: "Grid Trading",
    description:
      "Agents that place and manage buy/sell grids across a price range to capture volatility around a pair.",
    tagline: "Profit from volatility with automated buy/sell grids.",
    discoveryQuery: "grid",
  },
  {
    slug: "yield-optimisation",
    name: "Yield Optimisation",
    shortName: "Yield",
    description:
      "Agents that move capital across lending markets, LPs, and vaults on BNB Chain to maximise risk-adjusted yield.",
    tagline: "Put idle capital to work at the best available yield.",
    discoveryQuery: "yield",
  },
  {
    slug: "health-factor-monitoring",
    name: "Health Factor Monitoring",
    shortName: "Health Factor",
    description:
      "Agents that watch lending positions and act — topping up collateral or de-risking — before liquidation risk hits.",
    tagline: "Never get liquidated while you sleep.",
    discoveryQuery: "health factor",
  },
];

export const CATEGORY_MAP: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, Category>;

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_MAP[slug as CategorySlug];
}

export const CATEGORY_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);
