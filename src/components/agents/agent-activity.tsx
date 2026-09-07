"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  FileCode,
  ShieldCheck,
  Zap,
} from "lucide-react";

import type { Agent } from "@/lib/types";
import {
  getAgentActivityStats,
  useAgentActivity,
  type ActivityEventType,
} from "@/lib/agent-activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface AgentActivityProps {
  agent: Agent;
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  job_settled: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    label: "Settled Escrow",
  },
  job_hired: {
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    label: "Hiring Funded",
  },
  deliverable_submitted: {
    icon: FileCode,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    label: "Deliverable Ready",
  },
  feedback_received: {
    icon: ShieldCheck,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    label: "Review Stamped",
  },
  identity_registered: {
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    label: "ERC-8004 Identity",
  },
};

export function AgentActivity({ agent }: AgentActivityProps) {
  const activities = useAgentActivity(agent);
  const [filterType, setFilterType] = useState<ActivityEventType | "all">("all");

  const stats = useMemo(() => getAgentActivityStats(activities), [activities]);

  const filtered = useMemo(() => {
    if (filterType === "all") return activities;
    return activities.filter((a) => a.type === filterType);
  }, [activities, filterType]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* PERFORMANCE & METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card/80 p-4 space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Coins className="size-3.5 text-primary" />
            <span>Escrow Settled</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">
            {stats.totalVolumeU} <span className="text-xs text-primary font-mono">$U</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>Jobs Completed</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">
            {stats.totalJobsCompleted}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="size-3.5 text-blue-500" />
            <span>Avg Response</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">
            {stats.avgResponseTime}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Success Rate</span>
          </div>
          <p className="font-heading text-xl font-bold text-foreground">
            {stats.successRate}
          </p>
        </div>
      </div>

      {/* FILTER BUTTONS & HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Execution Log & Timeline ({filtered.length})
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={filterType === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("all")}
            className="text-xs h-7 px-2.5"
          >
            All
          </Button>
          <Button
            variant={filterType === "job_settled" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("job_settled")}
            className="text-xs h-7 px-2.5"
          >
            Settled
          </Button>
          <Button
            variant={filterType === "job_hired" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("job_hired")}
            className="text-xs h-7 px-2.5"
          >
            Hires
          </Button>
          <Button
            variant={filterType === "deliverable_submitted" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("deliverable_submitted")}
            className="text-xs h-7 px-2.5"
          >
            Deliverables
          </Button>
        </div>
      </div>

      {/* TIMELINE FEED */}
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center space-y-2">
          <Activity className="size-8 text-muted-foreground mx-auto opacity-50" />
          <h4 className="text-sm font-semibold text-foreground">No On-Chain Activity Recorded Yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This agent has not had any hiring sessions or task executions yet. When you hire this agent through Altana $U escrow, verified transaction records and deliverables will appear here in real time.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">No events for this filter</p>
          <p className="text-xs text-muted-foreground">Select another filter to view history.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
          {filtered.map((item) => {
            const conf = EVENT_CONFIG[item.type] || EVENT_CONFIG.job_settled;
            const Icon = conf.icon;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Icon */}
                <div
                  className={cn(
                    "absolute -left-6 top-1.5 flex size-5.5 -translate-x-1/2 items-center justify-center rounded-full border shadow-xs transition-transform group-hover:scale-110",
                    conf.bg,
                    conf.color,
                    conf.border
                  )}
                >
                  <Icon className="size-3" />
                </div>

                {/* Event Card */}
                <div className="rounded-xl border border-border bg-card/80 p-4 space-y-2.5 shadow-xs hover:border-border/90 transition-colors ml-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-mono px-1.5 py-0", conf.bg, conf.color, conf.border)}
                      >
                        {conf.label}
                      </Badge>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  {/* Deliverable Highlights Box */}
                  {item.deliverableSummary && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <FileCode className="size-3" />
                        <span>Deliverable Summary:</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.deliverableSummary}
                      </p>
                    </div>
                  )}

                  {/* Footer with Client, Amount, and Tx link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      {item.client && (
                        <span className="flex items-center gap-1">
                          <span>Buyer:</span>
                          <span className="text-foreground font-medium">{item.client}</span>
                          <CopyButton value={item.client} />
                        </span>
                      )}
                      {item.jobId && (
                        <span>
                          Job: <span className="text-foreground">{item.jobId}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      {item.amount && (
                        <Badge variant="secondary" className="text-xs font-mono font-bold text-foreground bg-muted">
                          {item.amount}
                        </Badge>
                      )}
                      {item.txHash && (
                        <a
                          href={`https://bscscan.com/tx/${item.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span>BscScan</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
