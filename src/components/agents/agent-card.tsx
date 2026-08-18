import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import type { Agent } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

function formatPrice(agent: Agent) {
  const { amount, currency, cadence } = agent.pricing;
  if (agent.pricing.model === "performance-fee") {
    return `${amount}${cadence}`;
  }
  return `${amount} ${currency}`;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const category = CATEGORY_MAP[agent.category];

  return (
    <Card className="group h-full gap-3 border-border transition-colors hover:border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
            style={{ backgroundColor: agent.avatarColor }}
            aria-hidden
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-medium text-foreground">
                {agent.name}
              </h3>
              {agent.verified && (
                <BadgeCheck
                  className="size-3.5 shrink-0 text-primary"
                  aria-label="Verified agent"
                />
              )}
            </div>
            <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
              {category?.shortName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{agent.tagline}</p>

        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {cap}
            </span>
          ))}
        </div>
      </CardContent>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          {
            label: "Rating",
            value: (
              <span className="flex items-center justify-center gap-1">
                <Star className="size-3 fill-primary text-primary" />
                {agent.reputation.rating.toFixed(1)}
              </span>
            ),
          },
          { label: "Jobs", value: agent.reputation.completedJobs.toLocaleString() },
          { label: "Price", value: formatPrice(agent) },
        ].map((stat) => (
          <div key={stat.label} className="px-2 py-2.5 text-center">
            <p className="text-[9px] tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="mt-0.5 text-xs font-medium text-foreground tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <CardFooter className="pt-3">
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href={`/agents/${agent.category}/${agent.slug}`}>View Agent</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
