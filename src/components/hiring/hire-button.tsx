import type { Agent } from "@/lib/types";
import { HireDialog } from "@/components/hiring/hire-dialog";

/**
 * Hiring runs entirely on its own passkey wallet (see HireDialog / lib/altana.ts)
 * — it doesn't need the separate header wallet (wagmi/MetaMask) connected
 * first. Gating "Hire Agent" behind that second wallet was an unnecessary
 * connect-a-wallet step before the one that actually matters; the passkey
 * wallet is created inline, at the point hiring actually needs it.
 */
export function HireButton({ agent, className }: { agent: Agent; className?: string }) {
  return <HireDialog agent={agent} className={className} />;
}
