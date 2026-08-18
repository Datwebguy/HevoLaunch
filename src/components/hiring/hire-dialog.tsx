"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { AlertTriangle, CheckCircle2, Fingerprint, Loader2 } from "lucide-react";

import type { Agent, HireSession } from "@/lib/types";
import {
  buildHireSession,
  createOrLoadHiringWallet,
  getStoredHiringWallet,
  runHireFlow,
  type StoredHiringWallet,
} from "@/lib/altana";
import { saveSession } from "@/lib/hire-sessions";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";

type Stage = "wallet" | "review" | "funding" | "result";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function HireDialog({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("wallet");
  const [wallet, setWallet] = useState<StoredHiringWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [task, setTask] = useState("");
  const [session, setSession] = useState<HireSession | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const existing = getStoredHiringWallet();
      setWallet(existing);
      setStage(existing ? "review" : "wallet");
      setSession(null);
    }
  }

  async function handleCreateWallet() {
    setConnecting(true);
    try {
      const { wallet: created } = await createOrLoadHiringWallet();
      setWallet(created);
      setStage("review");
    } finally {
      setConnecting(false);
    }
  }

  async function handleFund() {
    if (!wallet) return;
    const draft = buildHireSession(agent, wallet.address, task);
    setSession(draft);
    setStage("funding");

    const result = await runHireFlow(draft, (update) => setSession(update));
    saveSession(result);
    setStage("result");
  }

  function handleRetry() {
    setStage("review");
    setSession(null);
  }

  const budgetLabel = `${agent.pricing.amount} $U`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg">Hire Agent</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {stage === "wallet" && (
          <>
            <DialogHeader>
              <DialogTitle>Set up your hiring wallet</DialogTitle>
              <DialogDescription>
                Hiring on HevoLaunch runs through Altana&apos;s ERC-8183 job
                escrow. You&apos;ll need a noncustodial Altana wallet to fund
                jobs — created once with a passkey, no seed phrase.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Fingerprint className="size-8 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your device will prompt for a fingerprint, face, or security
                key. The key never leaves your device — Altana never
                custodies it.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateWallet} disabled={connecting} className="w-full">
                {connecting && <Loader2 className="animate-spin" />}
                {connecting ? "Waiting for passkey..." : "Create Hiring Wallet"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "review" && wallet && (
          <>
            <DialogHeader>
              <DialogTitle>Hire {agent.name}</DialogTitle>
              <DialogDescription>
                Funds are held in escrow until the job is delivered and the
                dispute window passes.
              </DialogDescription>
            </DialogHeader>

            {wallet.isDemoFallback && (
              <Alert>
                <AlertTriangle />
                <AlertTitle>Demo wallet</AlertTitle>
                <AlertDescription>
                  Passkey setup wasn&apos;t available in this browser, so
                  we&apos;re using a local demo wallet instead of a real
                  Altana passkey wallet.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 text-sm">
              <label className="block space-y-1.5">
                <span className="font-medium text-foreground">Task</span>
                <Textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder={`Run ${agent.capabilities[0]?.toLowerCase() ?? "your service"} for my portfolio on BNB Smart Chain.`}
                  rows={3}
                />
              </label>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-muted-foreground">Escrow budget</span>
                <span className="font-semibold text-foreground">{budgetLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-muted-foreground">Hiring wallet</span>
                <span className="font-mono text-xs text-foreground">
                  {truncate(wallet.address)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleFund} className="w-full">
                Fund & Hire
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "funding" && session && (
          <>
            <DialogHeader>
              <DialogTitle>Funding job escrow</DialogTitle>
              <DialogDescription>
                Creating the job and locking {budgetLabel} in the ERC-8183
                escrow contract.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="size-8 animate-spin text-primary" />
              <SessionStatusBadge status={session.status} />
            </div>
          </>
        )}

        {stage === "result" && session && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {session.status === "FAILED" ? (
                  <>
                    <AlertTriangle className="size-5 text-destructive" />
                    Funding failed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5 text-[#22C55E]" />
                    Job funded
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {session.status === "FAILED"
                  ? "The relay couldn't settle the funding transaction. No funds were moved."
                  : `${agent.name} has been hired. Track progress from your dashboard.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-muted-foreground">Status</span>
                <SessionStatusBadge status={session.status} />
              </div>
              {session.jobId && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span className="text-muted-foreground">Job ID</span>
                  <span className="font-mono text-xs text-foreground">#{session.jobId}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-muted-foreground">Escrowed</span>
                <span className="font-semibold text-foreground">
                  {formatUnits(BigInt(session.budget), 18)} $U
                </span>
              </div>
            </div>

            <DialogFooter>
              {session.status === "FAILED" ? (
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              ) : (
                <Button onClick={() => setOpen(false)} className="w-full">
                  Done
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
