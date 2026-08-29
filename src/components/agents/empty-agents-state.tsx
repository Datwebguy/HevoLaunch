import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyAgentsState({
  categoryName,
  flush = false,
}: {
  categoryName?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 px-1 py-4",
        !flush && "rounded-lg border border-border bg-card px-4 py-8"
      )}
    >
      <p className="text-pretty text-sm text-muted-foreground">
        {categoryName
          ? `No hire-ready agent in ${categoryName} yet.`
          : "No hire-ready agents yet."}
      </p>
      <Button size="sm" variant="outline" asChild>
        <Link href="/become-a-provider">Be the first to list one</Link>
      </Button>
    </div>
  );
}
