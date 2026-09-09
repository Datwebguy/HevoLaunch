import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function TaskDetailsPage() {
  return (
    <div className="page-wrap flex min-h-[60vh] items-center justify-center py-16">
      <Card className="max-w-xl border-amber-500/30 bg-card/80">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />
          <h1 className="font-heading text-2xl font-semibold text-foreground">Task escrow is unavailable</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Task details and local proposal state are disabled until the workflow is connected to a real BNB Smart Chain escrow contract.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
