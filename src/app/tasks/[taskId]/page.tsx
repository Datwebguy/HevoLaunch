"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";

import { CATEGORY_MAP } from "@/lib/categories";
import {
  getTaskById,
  getProposalsByTaskId,
  saveProposal,
  acceptProposalAndFund,
  submitTaskDeliverable,
  acceptTaskDeliverable,
  raiseTaskDispute,
  type Task,
  type TaskProposal,
} from "@/lib/task-marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TaskPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

function truncate(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function TaskDetailPage({ params }: TaskPageProps) {
  const { taskId } = use(params);
  const { address } = useAccount();

  const [task, setTask] = useState<Task | null>(() => getTaskById(taskId));
  const [proposals, setProposals] = useState<TaskProposal[]>(() => getProposalsByTaskId(taskId));

  // Proposal modal form state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [completionHours, setCompletionHours] = useState("24");
  const [proposalMessage, setProposalMessage] = useState("");

  // Deliverable modal form state
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableNotes, setDeliverableNotes] = useState("");

  // Dispute modal form state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  // Action states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const refreshData = () => {
    const foundTask = getTaskById(taskId);
    setTask(foundTask);
    if (foundTask) {
      const foundProposals = getProposalsByTaskId(taskId);
      setProposals(foundProposals);
    }
  };

  if (!task) {
    return (
      <div className="page-wrap py-16 max-w-2xl text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Task Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The requested task #{taskId} does not exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/tasks">Back to Task Marketplace</Link>
        </Button>
      </div>
    );
  }

  const category = CATEGORY_MAP[task.category];
  const isCreator = address && task.createdBy.toLowerCase() === address.toLowerCase();

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedBudget || !proposalMessage) return;

    const newProp: TaskProposal = {
      id: `prop_${Math.random().toString(36).substring(2, 9)}`,
      taskId: task.id,
      taskTitle: task.title,
      providerId: address || "0xAgentProvider",
      providerName: providerName || (address ? truncate(address) : "Autonomous Agent"),
      proposedBudget,
      estimatedCompletionHours: parseInt(completionHours) || 24,
      message: proposalMessage,
      createdAt: Date.now(),
      status: "pending",
    };

    saveProposal(newProp);
    setProposalModalOpen(false);
    setActionSuccess("Proposal submitted successfully!");
    refreshData();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleAcceptProposal = (prop: TaskProposal) => {
    acceptProposalAndFund(task.id, prop);
    setActionSuccess(`Accepted proposal from ${prop.providerName}! Escrow funded.`);
    refreshData();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableUrl) return;

    submitTaskDeliverable(task.id, deliverableUrl, deliverableNotes);
    setDeliverableModalOpen(false);
    setActionSuccess("Deliverable submitted for creator review!");
    refreshData();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleAcceptDeliverable = () => {
    acceptTaskDeliverable(task.id);
    setActionSuccess("Deliverable accepted! Escrow payout released to provider.");
    refreshData();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason || !disputeDescription) return;

    raiseTaskDispute(task.id, address || task.createdBy, disputeReason, disputeDescription);
    setDisputeModalOpen(false);
    setActionSuccess("Dispute raised. Altana arbitration policy initiated.");
    refreshData();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="page-wrap max-w-4xl py-10 space-y-6">
      {/* TOP NAVIGATION & SUCCESS ALERT */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Task Marketplace
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Task ID: #{task.id}
        </span>
      </div>

      {actionSuccess && (
        <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TASK HEADER CARD */}
      <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono border-border bg-muted/50">
                {category?.name || task.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-mono uppercase tracking-wider ${
                  task.status === "published"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : task.status === "in_progress"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                    : task.status === "delivered"
                    ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                    : task.status === "accepted"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                {task.status.replace("_", " ")}
              </Badge>
              {task.assignedProviderName && (
                <span className="text-xs text-muted-foreground font-mono">
                  Assigned: <strong className="text-foreground">{task.assignedProviderName}</strong>
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {task.title}
            </h1>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 text-right space-y-0.5 shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground">Task Escrow Budget</span>
            <p className="font-heading text-2xl font-bold text-primary flex items-center justify-end gap-1">
              <Coins className="size-5" />
              {task.budget} $U
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        <div className="flex flex-wrap items-center gap-5 text-xs font-mono text-muted-foreground border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5" />
            <span>Creator:</span>
            <span className="text-foreground font-semibold">{truncate(task.createdBy)}</span>
            <CopyButton value={task.createdBy} />
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Altana ERC-8183 Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* DELIVERABLES & SPECS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* EXPECTED DELIVERABLES */}
          <Card className="border-border/80 bg-card">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Required Deliverables
              </h2>
              {task.deliverables && task.deliverables.length > 0 ? (
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  {task.deliverables.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 p-2 rounded bg-muted/40 border border-border/50">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold">
                        {index + 1}
                      </span>
                      <span className="text-foreground pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No specific line items defined.</p>
              )}

              {task.terms && (
                <div className="pt-2 border-t border-border/60 space-y-1">
                  <span className="text-xs font-semibold text-foreground">Terms & Execution Scope:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{task.terms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DELIVERABLE REVIEW SECTION IF DELIVERED */}
          {task.status === "delivered" && (
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-500" />
                    Agent Deliverable Ready for Review
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-400">
                    Awaiting Acceptance
                  </Badge>
                </div>

                <div className="rounded-lg bg-background/80 border border-border/70 p-3.5 space-y-2 text-xs font-mono">
                  {task.deliverableUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Deliverable Link / IPFS:</span>
                      <a
                        href={task.deliverableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-semibold truncate max-w-[280px]"
                      >
                        {task.deliverableUrl}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {task.deliverableNotes && (
                    <p className="text-muted-foreground leading-relaxed pt-1">
                      {task.deliverableNotes}
                    </p>
                  )}
                </div>

                {isCreator && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button onClick={handleAcceptDeliverable} className="gap-1.5 font-medium shadow-sm">
                      <CheckCircle2 className="size-4" />
                      Accept Deliverable & Release Escrow ({task.budget} $U)
                    </Button>
                    <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                          <ShieldAlert className="size-4" />
                          Raise Dispute
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-card">
                        <DialogHeader>
                          <DialogTitle>Raise Task Dispute</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRaiseDispute} className="space-y-4 pt-2">
                          <div>
                            <label className="text-xs font-medium">Dispute Reason *</label>
                            <Input
                              placeholder="e.g., Deliverable incomplete / inaccurate calculations"
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Detailed Explanation *</label>
                            <Textarea
                              placeholder="Describe what was missing or non-compliant..."
                              rows={3}
                              value={disputeDescription}
                              onChange={(e) => setDisputeDescription(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" variant="destructive" className="w-full">
                            Submit Dispute to Altana Arbitration
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* DELIVERABLE COMPLETED SECTION IF ACCEPTED */}
          {task.status === "accepted" && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="size-4.5" />
                  <span>Task Successfully Completed & Escrow Paid Out</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {task.budget} $U was released to the provider. The deliverable is permanently preserved.
                </p>
              </CardContent>
            </Card>
          )}

          {/* PROPOSALS & BIDS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                Agent Proposals ({proposals.length})
              </h2>

              {task.status === "published" && (
                <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 font-medium">
                      <Zap className="size-3.5 text-primary-foreground" />
                      Submit Proposal / Bid
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card">
                    <DialogHeader>
                      <DialogTitle>Submit Agent Proposal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProposal} className="space-y-4 pt-2">
                      <div>
                        <label className="text-xs font-medium">Agent / Provider Name</label>
                        <Input
                          placeholder="e.g. MyBNBAgent (ERC-8004)"
                          value={providerName}
                          onChange={(e) => setProviderName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Proposed Budget ($U) *</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="5.0"
                            value={proposedBudget}
                            onChange={(e) => setProposedBudget(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Turnaround (Hours)</label>
                          <Input
                            type="number"
                            value={completionHours}
                            onChange={(e) => setCompletionHours(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Proposal Pitch / Strategy *</label>
                        <Textarea
                          placeholder="Explain how your AI agent will execute this task..."
                          rows={3}
                          value={proposalMessage}
                          onChange={(e) => setProposalMessage(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full gap-1.5">
                        <Send className="size-4" />
                        Submit Bid
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {proposals.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-card p-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No agent proposals submitted yet. Be the first AI provider to bid!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((prop) => (
                  <Card key={prop.id} className="border-border/80 bg-card/80">
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {prop.providerName}
                            </span>
                            {prop.status === "accepted" && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-mono">
                                Accepted
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Estimated: {prop.estimatedCompletionHours} hours turnaround
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

                      {isCreator && task.status === "published" && prop.status === "pending" && (
                        <div className="pt-2 border-t border-border/50 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptProposal(prop)}
                            className="gap-1.5 font-medium"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Accept & Fund Escrow ({prop.proposedBudget} $U)
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: ESCROW DETAILS & ACTIONS */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardContent className="p-5 space-y-4 text-xs font-mono">
              <h3 className="font-semibold text-foreground text-sm font-sans flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Escrow Settlement
              </h3>

              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Escrow Token:</span>
                  <span className="text-foreground font-semibold">$U (United Stables)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Standard:</span>
                  <span className="text-foreground">Altana ERC-8183</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="text-foreground">BNB Chain Testnet</span>
                </div>
                {task.escrowTxHash && (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Funding Tx:</span>
                    <a
                      href={`https://testnet.bscscan.com/tx/${task.escrowTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {truncate(task.escrowTxHash)}
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION: SUBMIT DELIVERABLE (IF ASSIGNED AND IN PROGRESS) */}
              {task.status === "in_progress" && (
                <div className="pt-2">
                  <Dialog open={deliverableModalOpen} onOpenChange={setDeliverableModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-1.5 font-medium shadow-sm">
                        <Send className="size-3.5" />
                        Submit Agent Deliverable
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card">
                      <DialogHeader>
                        <DialogTitle>Submit Deliverable for Task #{task.id}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmitDeliverable} className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs font-medium">Deliverable URL / IPFS Hash *</label>
                          <Input
                            placeholder="https://ipfs.io/ipfs/bafy... or public report URL"
                            value={deliverableUrl}
                            onChange={(e) => setDeliverableUrl(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Summary & Notes</label>
                          <Textarea
                            placeholder="Detail what was analyzed and provide summary conclusions..."
                            rows={3}
                            value={deliverableNotes}
                            onChange={(e) => setDeliverableNotes(e.target.value)}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Submit to Client
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
