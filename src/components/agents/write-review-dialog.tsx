"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { CheckCircle2, Loader2, PenLine, ShieldCheck, Star } from "lucide-react";

import type { Agent } from "@/lib/types";
import { saveNewAgentReview, type AgentReview } from "@/lib/agent-reviews";
import { getStoredHiringWallet } from "@/lib/altana";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AVAILABLE_TAGS = [
  "Accurate Analysis",
  "Fast Execution",
  "Clean Deliverables",
  "Non-Custodial",
  "Reliable",
  "Low Gas Routes",
  "DeFi Strategy",
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor experience",
  2: "Fair, needs improvement",
  3: "Good execution",
  4: "Very good strategy",
  5: "Exceptional & accurate",
};

interface WriteReviewDialogProps {
  agent: Agent;
  onReviewSubmitted?: (newReview: AgentReview) => void;
}

export function WriteReviewDialog({ agent, onReviewSubmitted }: WriteReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Accurate Analysis", "Non-Custodial"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { address: wagmiAddress, isConnected } = useAccount();
  const passkeyWallet = typeof window !== "undefined" ? getStoredHiringWallet() : null;

  const currentAddress = wagmiAddress || passkeyWallet?.address || "0x71C84B20...91A4";
  const displayAddress = `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    // Simulate short network delay for on-chain ERC-8004 feedback indexing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newRev = saveNewAgentReview({
      agentId: agent.agentId,
      agentSlug: agent.slug,
      reviewerAddress: displayAddress,
      rating,
      title: title.trim() || `${RATING_LABELS[rating] || "Agent Feedback"}`,
      comment: comment.trim(),
      tags: selectedTags,
      verified: true,
      jobId: `job_${Math.random().toString(36).slice(2, 10)}`,
    });

    setIsSubmitting(false);
    setSuccess(true);

    if (onReviewSubmitted) {
      onReviewSubmitted(newRev);
    }

    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      setTitle("");
      setComment("");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 font-medium shadow-xs">
          <PenLine className="size-3.5" />
          <span>Write a Review</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span>Rate & Review</span>
            <span className="text-primary font-bold">{agent.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share your feedback on this agent&apos;s non-custodial strategy and execution. Reviews are stamped with your verified wallet address.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="size-6 animate-in zoom-in-50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Feedback Published!</h3>
              <p className="text-xs text-muted-foreground">
                Your review has been recorded and submitted to the ERC-8004 feedback feed.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* STAR RATING PICKER */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Overall Rating</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={cn(
                          "size-6 transition-all",
                          active
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK TAGS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category Highlights</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer border",
                        selected
                          ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {selected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REVIEW TITLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Headline (optional)</label>
              <Input
                placeholder="e.g. Accurate rebalancing with lowest gas routes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs bg-muted/30"
              />
            </div>

            {/* REVIEW COMMENT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Detailed Feedback</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {comment.length} / 500
                </span>
              </label>
              <Textarea
                placeholder="Describe your experience with this agent: strategy accuracy, response time, non-custodial safety..."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                required
                rows={4}
                className="text-xs bg-muted/30 resize-none"
              />
            </div>

            {/* WALLET & VERIFICATION BADGE */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Reviewer Identity:</span>
                <span className="font-mono text-foreground font-medium">{displayAddress}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                {isConnected || passkeyWallet ? "Connected Wallet" : "Verified Buyer"}
              </Badge>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !comment.trim()}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Signing Feedback...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
