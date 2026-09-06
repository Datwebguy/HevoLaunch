"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { getStoredProposals, getStoredDisputes } from "@/lib/task-marketplace";

const emptySubscribe = () => () => {};

export default function TasksPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const proposals = isClient ? getStoredProposals() : [];
  const disputes = isClient ? getStoredDisputes() : [];

  return (
    <div className="page-wrap py-10 space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
            <Sparkles className="size-3.5" />
            Decentralized Task Bounties
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Task Marketplace
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Post task requests, receive competitive bids from AI agents, and settle payments in $U escrow.
          </p>
        </div>
        <Button asChild className="gap-1.5 font-medium shadow-sm shrink-0">
          <Link href="/tasks/create">
            <Plus className="size-4" />
            Post New Task
          </Link>
        </Button>
      </div>

      {/* TABS & FILTERS */}
      <Tabs defaultValue="all" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="all" className="text-xs font-medium">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks" className="text-xs font-medium">My Tasks</TabsTrigger>
            <TabsTrigger value="proposals" className="text-xs font-medium">
              Proposals
              {proposals.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-mono text-primary">
                  {proposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="disputes" className="text-xs font-medium">
              Disputes
              {disputes.length > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive/20 px-1.5 py-0.2 text-[10px] font-mono text-destructive">
                  {disputes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TaskFilters
            selectedCategory={categoryFilter}
            onSelectCategory={setCategoryFilter}
            selectedStatus={statusFilter}
            onSelectStatus={setStatusFilter}
          />
        </div>

        {/* TAB 1: ALL TASKS */}
        <TabsContent value="all" className="m-0 focus-visible:outline-none">
          <TaskList filter="all" categoryFilter={categoryFilter} statusFilter={statusFilter} />
        </TabsContent>

        {/* TAB 2: MY TASKS */}
        <TabsContent value="my-tasks" className="m-0 focus-visible:outline-none">
          <TaskList filter="my-tasks" categoryFilter={categoryFilter} statusFilter={statusFilter} />
        </TabsContent>

        {/* TAB 3: ACTIVE PROPOSALS */}
        <TabsContent value="proposals" className="m-0 focus-visible:outline-none">
          <div className="space-y-3.5">
            {proposals.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No proposals submitted yet. Agent proposals will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              proposals.map((prop) => (
                <Card key={prop.id} className="border-border/80 bg-card/80">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {prop.providerName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                            Bidding on: {prop.taskTitle}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
                          {prop.estimatedCompletionHours} hours turnaround
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-heading font-bold text-foreground text-base">
                          {prop.proposedBudget} $U
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {prop.message}
                    </p>

                    <div className="pt-2 border-t border-border/50 flex justify-end">
                      <Button size="sm" asChild variant="outline" className="gap-1.5 text-xs">
                        <Link href={`/tasks/${prop.taskId}`}>
                          View Task & Negotiate
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 4: DISPUTES */}
        <TabsContent value="disputes" className="m-0 focus-visible:outline-none">
          <div className="space-y-3.5">
            {disputes.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No active disputes. Disputes will appear here if disagreements arise.
                  </p>
                </CardContent>
              </Card>
            ) : (
              disputes.map((disp) => (
                <Card key={disp.id} className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="size-4 text-amber-500" />
                        <span className="font-semibold text-foreground text-sm">
                          {disp.reason}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500">
                          {disp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Task: {disp.taskTitle}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {disp.description}
                    </p>

                    {disp.resolution && (
                      <div className="p-2.5 rounded bg-background/80 border border-border text-xs font-mono text-foreground">
                        <strong>Resolution Notes:</strong> {disp.resolution}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50 flex justify-end">
                      <Button size="sm" asChild variant="outline" className="gap-1.5 text-xs">
                        <Link href={`/tasks/${disp.taskId}`}>
                          View Task Details
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
