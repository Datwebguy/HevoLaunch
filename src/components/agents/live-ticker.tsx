import { AGENTS } from "@/lib/mock-agents";
import { CATEGORY_MAP } from "@/lib/categories";

function formatPrice(agent: (typeof AGENTS)[number]) {
  const { amount, currency, cadence } = agent.pricing;
  return agent.pricing.model === "performance-fee"
    ? `${amount}${cadence}`
    : `${amount} ${currency}`;
}

/**
 * Continuously auto-scrolling strip of live listings — the content is
 * duplicated once so the loop is seamless (the track scrolls exactly
 * half its own width, then resets invisibly). Pauses on hover so it
 * doesn't fight anyone trying to actually read it.
 */
export function LiveTicker() {
  const items = AGENTS.slice(0, 14).map((agent) => ({
    id: agent.id,
    name: agent.name,
    category: CATEGORY_MAP[agent.category]?.shortName ?? agent.category,
    price: formatPrice(agent),
  }));
  const track = [...items, ...items];

  return (
    <div className="group overflow-hidden border-y border-border bg-card">
      <div className="animate-marquee flex w-max py-2.5 group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="flex shrink-0 items-center gap-2 px-4 text-xs whitespace-nowrap"
          >
            <span className="size-1 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="font-medium text-foreground">{item.name}</span>
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
              {item.category}
            </span>
            <span className="tabular-nums text-muted-foreground">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
