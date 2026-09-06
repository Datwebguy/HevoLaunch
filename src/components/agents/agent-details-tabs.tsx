"use client";

import { ReactNode } from "react";
import type { Agent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentReviews } from "@/components/agents/agent-reviews";
import { AgentActivity } from "@/components/agents/agent-activity";
import { useAgentReviews } from "@/lib/agent-reviews";
import { useAgentActivity } from "@/lib/agent-activity";

interface AgentDetailsTabsProps {
  agent: Agent;
  overviewContent: ReactNode;
}

export function AgentDetailsTabs({ agent, overviewContent }: AgentDetailsTabsProps) {
  const reviews = useAgentReviews(agent);
  const activities = useAgentActivity(agent);

  const reviewCount = reviews.length;
  const activityCount = activities.length;

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reviews" className="flex items-center gap-1.5">
          <span>Reviews</span>
          <Badge
            variant={reviewCount > 0 ? "secondary" : "outline"}
            className="ml-0.5 px-1.5 py-0 text-[11px] font-mono"
          >
            {reviewCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-1.5">
          <span>Activity</span>
          <Badge
            variant={activityCount > 0 ? "secondary" : "outline"}
            className="ml-0.5 px-1.5 py-0 text-[11px] font-mono"
          >
            {activityCount}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8 pt-4">
        {overviewContent}
      </TabsContent>

      <TabsContent value="reviews">
        <AgentReviews agent={agent} />
      </TabsContent>

      <TabsContent value="activity">
        <AgentActivity agent={agent} />
      </TabsContent>
    </Tabs>
  );
}
