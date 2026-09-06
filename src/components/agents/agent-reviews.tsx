"use client";

import { useMemo, useState } from "react";
import { MessageSquare, ShieldCheck, Star, ThumbsUp } from "lucide-react";

import type { Agent } from "@/lib/types";
import {
  getAgentRatingStats,
  useAgentReviews,
  toggleHelpfulVote,
} from "@/lib/agent-reviews";
import { WriteReviewDialog } from "@/components/agents/write-review-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AgentReviewsProps {
  agent: Agent;
}

export function AgentReviews({ agent }: AgentReviewsProps) {
  const reviews = useAgentReviews(agent);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("hevolaunch_helpful_reviews_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const stats = useMemo(() => getAgentRatingStats(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    if (filterRating === "all") return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filterRating);
  }, [reviews, filterRating]);

  const handleReviewSubmitted = () => {
    // Reactive hook useAgentReviews automatically updates
  };

  const handleHelpful = (reviewId: string) => {
    const success = toggleHelpfulVote(reviewId);
    if (success) {
      setVotedIds((prev) => [...prev, reviewId]);
    }
  };

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
      {/* RATING BREAKDOWN CARD */}
      <div className="rounded-xl border border-border bg-card/80 p-5 sm:p-6 shadow-xs">
        {stats.totalReviews === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold text-foreground">
                No Customer Reviews Yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                This agent has not received reviews yet. Hired this agent? Leave verified feedback on its execution and strategy.
              </p>
            </div>
            <div className="pt-2">
              <WriteReviewDialog agent={agent} onReviewSubmitted={handleReviewSubmitted} />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            {/* BIG RATING SCORE */}
            <div className="flex flex-col items-center justify-center text-center md:col-span-4 md:border-r md:border-border md:pr-6">
              <div className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-4",
                      star <= Math.round(stats.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {stats.totalReviews} verified feedback{stats.totalReviews !== 1 ? "s" : ""}
              </p>
              <div className="mt-4">
                <WriteReviewDialog agent={agent} onReviewSubmitted={handleReviewSubmitted} />
              </div>
            </div>

            {/* DISTRIBUTION BARS */}
            <div className="space-y-2 md:col-span-8 md:pl-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage =
                  stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setFilterRating((prev) => (prev === star ? "all" : (star as number)))
                    }
                    className={cn(
                      "flex items-center gap-3 text-xs w-full text-left p-1 rounded-md transition-colors cursor-pointer group",
                      filterRating === star ? "bg-muted font-semibold" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="w-12 font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                      {star} <Star className="size-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2 bg-muted" />
                    </div>
                    <span className="w-8 text-right font-mono text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {stats.totalReviews > 0 && (
        <>
          {/* FILTER BUTTONS & HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Customer Reviews ({filteredReviews.length})
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={filterRating === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterRating("all")}
                className="text-xs h-7 px-2.5"
              >
                All
              </Button>
              {[5, 4, 3].map((star) => {
                const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                if (count === 0 && filterRating !== star) return null;
                return (
                  <Button
                    key={star}
                    variant={filterRating === star ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterRating(star)}
                    className="text-xs h-7 px-2.5 gap-1"
                  >
                    <span>{star}</span>
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">({count})</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* REVIEWS LIST */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted mx-auto text-muted-foreground">
            <MessageSquare className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No reviews in this filter</p>
            <p className="text-xs text-muted-foreground">
              Be the first verified user to leave feedback for this rating.
            </p>
          </div>
          <WriteReviewDialog agent={agent} onReviewSubmitted={handleReviewSubmitted} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isVoted = votedIds.includes(rev.id);
            return (
              <div
                key={rev.id}
                className="rounded-xl border border-border bg-card/80 p-5 space-y-3 shadow-xs hover:border-border/90 transition-colors"
              >
                {/* REVIEW CARD HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {rev.reviewerAddress.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {rev.reviewerAddress}
                        </span>
                        {rev.verified && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 gap-1"
                          >
                            <ShieldCheck className="size-2.5" />
                            <span>Verified Buyer</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* STARS */}
                  <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "size-3",
                          star <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* REVIEW TITLE & COMMENT */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-foreground">{rev.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* TAGS */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] font-normal text-muted-foreground bg-muted/60"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* FOOTER & HELPFUL BUTTON */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {rev.jobId && (
                      <span className="text-muted-foreground/70">
                        Escrow: {rev.jobId}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleHelpful(rev.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      isVoted
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ThumbsUp className="size-3" />
                    <span>Helpful ({rev.helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
