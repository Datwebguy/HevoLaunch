"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { Agent, Category, CategorySlug } from "@/lib/types";
import { AgentCard } from "@/components/agents/agent-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "rating" | "jobs" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  rating: "Top rated",
  jobs: "Most jobs",
  name: "Name (A to Z)",
};

function matchesQuery(agent: Agent, query: string) {
  const haystack = [agent.name, agent.tagline, ...agent.capabilities]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function sortAgents(agents: Agent[], sortBy: SortKey): Agent[] {
  const sorted = [...agents];
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => b.reputation.rating - a.reputation.rating);
    case "jobs":
      return sorted.sort(
        (a, b) => b.reputation.completedJobs - a.reputation.completedJobs
      );
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Real client-side search + filter over HevoLaunch's own curated agents
 * (a small, fully-loaded list — no need for server round-trips per
 * keystroke). Category pills and sort are functional filters, not the
 * anchor-jump links this used to be.
 */
export function AgentSearch({
  agents,
  categories,
}: {
  agents: Agent[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("rating");

  const filtered = useMemo(() => {
    const byCategory =
      category === "all" ? agents : agents.filter((a) => a.category === category);
    const byQuery = query.trim()
      ? byCategory.filter((a) => matchesQuery(a, query))
      : byCategory;
    return sortAgents(byQuery, sortBy);
  }, [agents, category, query, sortBy]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents by name, task, or capability"
            className="h-9 pl-8"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="h-9 shrink-0 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            category === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          All
          <span
            className={`ml-1.5 ${category === "all" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
          >
            {agents.length}
          </span>
        </button>
        {categories.map((c) => {
          const count = agents.filter((a) => a.category === c.slug).length;
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(active ? "all" : c.slug)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c.name}
              <span
                className={`ml-1.5 ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {filtered.length} agent{filtered.length === 1 ? "" : "s"}
        {query.trim() && ` matching "${query.trim()}"`}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-3 space-y-2">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
          No agents match{query.trim() ? ` "${query.trim()}"` : " this filter"}.
        </div>
      )}
    </div>
  );
}
