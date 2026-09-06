"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock, Coins, ShieldCheck, User, Zap, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStoredTasks, type Task } from "@/lib/task-marketplace";
import { CATEGORY_MAP } from "@/lib/categories";
import { useAccount } from "wagmi";

const emptySubscribe = () => () => {};

interface TaskListProps {
  filter: "all" | "my-tasks";
  categoryFilter?: string;
  statusFilter?: string;
}

export function TaskList({ filter, categoryFilter = "all", statusFilter = "all" }: TaskListProps) {
  const { address } = useAccount();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const tasks = useMemo(() => {
    if (!isClient) return [];
    const all = getStoredTasks();

    let filtered = all;

    if (filter === "my-tasks") {
      if (!address) return [];
      filtered = filtered.filter((t) => t.createdBy.toLowerCase() === address.toLowerCase());
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    return filtered;
  }, [filter, categoryFilter, statusFilter, address, isClient]);

  if (!isClient) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-card/60">
            <CardContent className="p-6 h-28" />
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-border bg-card/80">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No tasks match the selected filters. Post a new task bounty!"
              : "You haven't posted any tasks yet. Connect your wallet and create your first bounty."}
          </p>
          <Button asChild className="gap-1.5 font-medium">
            <Link href="/tasks/create">
              <Zap className="size-4" />
              Post a Task Bounty
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const category = CATEGORY_MAP[task.category];

  const statusColors: Record<string, { bg: string; text: string }> = {
    published: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500" },
    in_progress: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-500" },
    funded: { bg: "bg-primary/10 border-primary/30", text: "text-primary" },
    delivered: { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-500" },
    accepted: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500" },
  };

  const statusStyle = statusColors[task.status] || {
    bg: "bg-muted border-border",
    text: "text-muted-foreground",
  };

  return (
    <Card className="border-border/80 bg-card/80 hover:border-primary/40 transition-all shadow-xs group">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tasks/${task.id}`}
                className="font-semibold text-foreground text-base tracking-tight hover:text-primary transition-colors"
              >
                {task.title}
              </Link>
              <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
                {task.status.replace("_", " ")}
              </Badge>
              {category && (
                <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/60">
                  {category.shortName}
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {task.description}
            </p>

            {task.deliverables && task.deliverables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {task.deliverables.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded bg-muted/70 px-2 py-0.5 text-[11px] font-mono text-muted-foreground border border-border/50"
                  >
                    <ShieldCheck className="size-3 text-primary" />
                    {d}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Coins className="size-3.5 text-primary" />
                <span>{task.budget} $U</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="size-3.5 text-muted-foreground" />
                <span>By {task.createdBy.slice(0, 6)}...{task.createdBy.slice(-4)}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            <Button size="sm" asChild className="gap-1.5 w-full sm:w-auto font-medium">
              <Link href={`/tasks/${task.id}`}>
                View Task
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
