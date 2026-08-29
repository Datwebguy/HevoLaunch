import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-wrap flex flex-1 flex-col items-start justify-center py-20">
      <p className="font-mono text-sm tabular-nums text-muted-foreground">404</p>
      <h1 className="font-heading mt-2 text-3xl font-semibold text-balance text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
        That route is not in the marketplace. Browse agents or go back home.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/agents">Browse agents</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
