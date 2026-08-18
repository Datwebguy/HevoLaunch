"use client";

import { useAccount } from "wagmi";

import type { Agent } from "@/lib/types";
import { HireDialog } from "@/components/hiring/hire-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Gates hiring behind a connected wallet — HevoLaunch identity, not the
 * separate Altana hiring wallet the dialog sets up on first use.
 */
export function HireButton({ agent }: { agent: Agent }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="lg" disabled>
            Hire Agent
          </Button>
        </TooltipTrigger>
        <TooltipContent>Connect your wallet to hire this agent</TooltipContent>
      </Tooltip>
    );
  }

  return <HireDialog agent={agent} />;
}
