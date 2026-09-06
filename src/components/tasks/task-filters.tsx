"use client";

import { CATEGORIES } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";

interface TaskFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export function TaskFilters({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        <Badge
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => onSelectCategory("all")}
          className="cursor-pointer text-xs font-mono py-1 px-2.5 transition-all"
        >
          All Desks
        </Badge>
        {CATEGORIES.map((c) => (
          <Badge
            key={c.slug}
            variant={selectedCategory === c.slug ? "default" : "outline"}
            onClick={() => onSelectCategory(c.slug)}
            className="cursor-pointer text-xs font-mono py-1 px-2.5 transition-all"
          >
            {c.shortName}
          </Badge>
        ))}
      </div>

      <div className="hidden sm:flex items-center gap-1 border-l border-border pl-2">
        <Badge
          variant={selectedStatus === "all" ? "secondary" : "outline"}
          onClick={() => onSelectStatus("all")}
          className="cursor-pointer text-[11px] font-mono"
        >
          All Statuses
        </Badge>
        <Badge
          variant={selectedStatus === "published" ? "secondary" : "outline"}
          onClick={() => onSelectStatus("published")}
          className="cursor-pointer text-[11px] font-mono text-emerald-500"
        >
          Open
        </Badge>
        <Badge
          variant={selectedStatus === "in_progress" ? "secondary" : "outline"}
          onClick={() => onSelectStatus("in_progress")}
          className="cursor-pointer text-[11px] font-mono text-blue-500"
        >
          In Progress
        </Badge>
      </div>
    </div>
  );
}
