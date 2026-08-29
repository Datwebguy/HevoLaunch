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
      "Agents that read a wallet against a target allocation and return the trades needed to close the drift. They recommend; they do not execute.",
    tagline: "See the trades that close the drift.",
    discoveryQuery: "rebalanc",
  },
  {
    slug: "grid-trading",
    name: "Grid Trading",
    shortName: "Grid Trading",
    description:
      "Agents that design a grid for a pair and price range — levels, order sizes, expected capture — as a plan you or your bot can execute.",
    tagline: "Get a grid plan for a pair and range.",
    discoveryQuery: "grid",
  },
  {
    slug: "yield-optimisation",
    name: "Yield Optimisation",
    shortName: "Yield",
    description:
      "Agents that compare lending and staking markets on BNB Chain and recommend where to allocate for a size and risk tier. They do not move funds.",
    tagline: "Find where to put idle capital.",
    discoveryQuery: "yield",
  },
  {
    slug: "health-factor-monitoring",
    name: "Health Factor Monitoring",
    shortName: "Health Factor",
    description:
      "Agents that read a lending position's health factor against a safety threshold and recommend how to restore a buffer. They do not top up or repay.",
    tagline: "Check a position before it gets liquidated.",
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
