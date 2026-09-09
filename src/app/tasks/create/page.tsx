import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function CreateTaskPage() {
  return (
    <div className="page-wrap flex min-h-[60vh] items-center justify-center py-16">
      <Card className="max-w-xl border-amber-500/30 bg-card/80">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />
          <h1 className="font-heading text-2xl font-semibold text-foreground">Task escrow is unavailable</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Creating tasks is disabled until a real BNB Smart Chain escrow integration is available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
