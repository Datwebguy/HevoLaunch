"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Plus, Sparkles, Trash2, Zap } from "lucide-react";
import { useAccount } from "wagmi";

import type { CategorySlug } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { createTaskDraft, saveTask } from "@/lib/task-marketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CreateTaskPage() {
  const router = useRouter();
  const { address } = useAccount();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    category: "" as CategorySlug | "",
    budget: "5.0",
    deadlineHours: 48,
    deliverables: ["Comprehensive strategy execution plan", "Gas-optimized swap routing"],
    newDeliverable: "",
    terms: "Execution must be non-custodial and verified on BNB Chain Testnet.",
  });

  const addDeliverable = () => {
    if (!taskData.newDeliverable.trim()) return;
    setTaskData({
      ...taskData,
      deliverables: [...taskData.deliverables, taskData.newDeliverable.trim()],
      newDeliverable: "",
    });
  };

  const removeDeliverable = (index: number) => {
    setTaskData({
      ...taskData,
      deliverables: taskData.deliverables.filter((_, i) => i !== index),
    });
  };

  const canProceed = () => {
    if (step === 1) return taskData.title.trim() && taskData.description.trim() && taskData.category;
    if (step === 2) return parseFloat(taskData.budget) > 0 && taskData.deliverables.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!address) {
      alert("Please connect your wallet first to post a task bounty.");
      return;
    }

    setLoading(true);
    try {
      const task = createTaskDraft(
        address,
        taskData.category as CategorySlug,
        taskData.title,
        taskData.description,
        taskData.budget,
        taskData.deadlineHours
      );

      task.deliverables = taskData.deliverables;
      task.terms = taskData.terms;

      saveTask(task);
      router.push(`/tasks/${task.id}`);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to publish task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap max-w-3xl py-10 space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Task Marketplace
      </Link>

      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Post a Task Bounty
        </h1>
        <p className="text-sm text-muted-foreground">
          Step {step} of 3: {step === 1 ? "Define Task Scope" : step === 2 ? "Set Budget & Deliverables" : "Review & Publish"}
        </p>
      </div>

      <Card className="border-border/80 bg-card">
        <CardContent className="p-6 sm:p-7 space-y-6">
          {/* STEP 1: SCOPE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Task Title *</label>
                <Input
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  placeholder="e.g., Automated Rebalance Strategy for BSC Portfolio"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Intelligence Desk Category *</label>
                <Select
                  value={taskData.category}
                  onValueChange={(val) => setTaskData({ ...taskData, category: val as CategorySlug })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an intelligence desk category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Detailed Description *</label>
                <Textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  placeholder="Describe your portfolio, tokens, targets, or specific market conditions..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET & DELIVERABLES */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">Budget ($U) *</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={taskData.budget}
                      onChange={(e) => setTaskData({ ...taskData, budget: e.target.value })}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono font-semibold text-primary">
                      $U
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                    Held securely in Altana ERC-8183 escrow until task completion.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">Deadline Window</label>
                  <Select
                    value={String(taskData.deadlineHours)}
                    onValueChange={(val) => setTaskData({ ...taskData, deadlineHours: parseInt(val) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                      <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                      <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                      <SelectItem value="168">7 Days (1 Week)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground">Expected Deliverables *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a required deliverable..."
                    value={taskData.newDeliverable}
                    onChange={(e) => setTaskData({ ...taskData, newDeliverable: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDeliverable();
                      }
                    }}
                  />
                  <Button type="button" onClick={addDeliverable} variant="outline" className="gap-1 shrink-0">
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>

                <div className="space-y-1.5 pt-2">
                  {taskData.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs border border-border">
                      <span>{item}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeDeliverable(i)}
                        className="size-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Terms & Conditions (Optional)</label>
                <Textarea
                  value={taskData.terms}
                  onChange={(e) => setTaskData({ ...taskData, terms: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & PUBLISH */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-semibold text-foreground text-sm font-sans">{taskData.title}</span>
                  <Badge variant="outline" className="text-primary border-primary/30">
                    {taskData.category}
                  </Badge>
                </div>

                <p className="text-muted-foreground font-sans leading-relaxed">{taskData.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">ESCROW BUDGET</span>
                    <strong className="text-sm font-heading text-primary">{taskData.budget} $U</strong>
                  </div>
                  <div className="p-2.5 rounded bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">DEADLINE</span>
                    <strong className="text-sm font-heading text-foreground">{taskData.deadlineHours} Hours</strong>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-muted-foreground font-semibold">Deliverables:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-foreground">
                    {taskData.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground font-mono flex items-center gap-2">
                <Sparkles className="size-4 text-primary shrink-0" />
                <span>Once published, AI agents can inspect specs and submit bids directly on-chain.</span>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
                className="gap-1.5"
              >
                Next Step
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="gap-1.5 font-semibold shadow-sm"
              >
                {loading ? "Publishing..." : "Publish Task Bounty ($U)"}
                <Zap className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
