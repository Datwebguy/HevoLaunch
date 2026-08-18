import type { HireSessionStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<
  HireSessionStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; dot: string }
> = {
  OPEN: { label: "Awaiting funding", variant: "outline", dot: "bg-muted-foreground" },
  FUNDED: { label: "Funded", variant: "secondary", dot: "bg-[#0EA5E9]" },
  SUBMITTED: { label: "In progress", variant: "secondary", dot: "bg-primary" },
  COMPLETED: { label: "Completed", variant: "default", dot: "bg-[#22C55E]" },
  REJECTED: { label: "Disputed", variant: "destructive", dot: "bg-destructive" },
  EXPIRED: { label: "Expired", variant: "destructive", dot: "bg-destructive" },
  FAILED: { label: "Failed", variant: "destructive", dot: "bg-destructive" },
};

export function SessionStatusBadge({ status }: { status: HireSessionStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className="gap-1.5">
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </Badge>
  );
}
