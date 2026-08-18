import { BadgeCheck, ExternalLink, MessageSquare, Star } from "lucide-react";

import type { ScanAgent } from "@/lib/8004scan";
import { relativeTimeFrom } from "@/lib/live-agents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const AVATAR_FALLBACK = "#0EA5E9";

/**
 * A real, on-chain-registered agent from 8004scan — not one of
 * HevoLaunch's curated listings. No fixed price is shown because ERC-8183
 * doesn't have one: the buyer proposes a job budget when they hire, the
 * agent doesn't advertise one.
 */
export function LiveAgentCard({ agent }: { agent: ScanAgent }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: AVATAR_FALLBACK }}
            aria-hidden
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {agent.name}
              </h3>
              {agent.is_verified && (
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified agent" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Token #{agent.token_id} · registered {relativeTimeFrom(agent.created_at)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">{agent.description}</p>

        {agent.supported_protocols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {agent.supported_protocols.map((protocol) => (
              <Badge key={protocol} variant="outline">
                {protocol}
              </Badge>
            ))}
            {agent.x402_supported && <Badge variant="outline">x402</Badge>}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-[#F0B90B] text-[#F0B90B]" />
            <span className="font-medium text-foreground">{agent.total_score.toFixed(1)}</span>
            score
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {agent.total_feedbacks} feedback{agent.total_feedbacks === 1 ? "" : "s"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border pt-4">
        <a
          href="https://8004scan.io/"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View on 8004scan
          <ExternalLink className="size-3.5" />
        </a>
      </CardFooter>
    </Card>
  );
}
