"use client";

import { useEffect, useRef, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bscTestnet } from "wagmi/chains";
import type { Signer } from "@altananetwork/sdk";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  Loader2,
} from "lucide-react";

import type { Agent, HireSession } from "@/lib/types";
import {
  buildHireSession,
  checkFunding,
  createOrLoadHiringWallet,
  explorerTxUrl,
  fundHireSession,
  getStoredHiringWallet,
  PAYMENT_TOKEN_ADDRESS,
  recoverHiringWallet,
  TESTNET_GAS_FAUCET_URL,
  TESTNET_U_FAUCET_URL,
  type FundingCheck,
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
import { CopyButton } from "@/components/ui/copy-button";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";

type Stage = "wallet" | "review" | "funding" | "result";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function HireDialog({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("wallet");
  const [wallet, setWallet] = useState<StoredHiringWallet | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [task, setTask] = useState("");
  const [session, setSession] = useState<HireSession | null>(null);
  const [fundingCheck, setFundingCheck] = useState<FundingCheck | null>(null);

  // This is HevoLaunch's own connected wallet (header nav, MetaMask/injected
  // via wagmi) — a completely different address from the Altana passkey
  // hiring wallet above. Funding a job requires the LATTER; this lets a
  // user move $U they already hold in the FORMER over in one click instead
  // of manually copying addresses between two wallets.
  const fundingLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const { address: connectedAddress, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: sending, reset: resetSend } = useWriteContract();
  const [sendHash, setSendHash] = useState<`0x${string}` | undefined>(undefined);
  const [sendError, setSendError] = useState<string | null>(null);
  const { isLoading: confirmingSend, isSuccess: sendConfirmed } = useWaitForTransactionReceipt({
    hash: sendHash,
    chainId: bscTestnet.id,
  });

  useEffect(() => {
    // Reacting to an external system (the chain confirming this transfer),
    // not synchronizing derived render state — the sanctioned effect case.
    if (sendConfirmed) {
      handleRetry();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSendHash(undefined);
      resetSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendConfirmed]);

  async function handleSendFromConnectedWallet() {
    if (!wallet || !session) return;
    setSendError(null);
    try {
      if (connectedChainId !== bscTestnet.id) {
        await switchChainAsync({ chainId: bscTestnet.id });
      }
      const hash = await writeContractAsync({
        address: PAYMENT_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [wallet.address, BigInt(session.budget)],
        chainId: bscTestnet.id,
      });
      setSendHash(hash);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Transfer was rejected or failed.");
    }
  }

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;

    setSession(null);
    setWalletError(null);

    const existing = getStoredHiringWallet();
    if (!existing) {
      setStage("wallet");
      return;
    }

    // Rehydrating an existing wallet never prompts WebAuthn — safe to run
    // on open, unlike creating a brand new one.
    const result = await createOrLoadHiringWallet();
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
    } else {
      setWalletError(result.error);
      setStage("wallet");
    }
  }

  async function handleCreateWallet() {
    setConnecting(true);
    setWalletError(null);
    const result = await createOrLoadHiringWallet();
    setConnecting(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
    } else {
      setWalletError(result.error);
    }
  }

  async function handleRecoverWallet() {
    setRecovering(true);
    setWalletError(null);
    const result = await recoverHiringWallet();
    setRecovering(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
    } else {
      setWalletError(result.error);
    }
  }

  async function handleFund() {
    if (!wallet || !signer || fundingLock.current) return;
    fundingLock.current = true;
    setBusy(true);
    const draft = buildHireSession(agent, wallet.address, task);
    setSession(draft);
    setStage("funding");

    try {
      const check = await checkFunding(wallet, BigInt(draft.budget));
      setFundingCheck(check);

      const result = await fundHireSession(wallet, signer, draft, (update) => setSession(update));
      saveSession(result);
      setStage("result");
    } catch (err) {
      const failed: HireSession = {
        ...draft,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Funding failed before the job was created.",
        updatedAt: Date.now(),
      };
      setSession(failed);
      saveSession(failed);
      setStage("result");
    } finally {
      fundingLock.current = false;
      setBusy(false);
    }
  }

  function handleRetry() {
    fundingLock.current = false;
    setBusy(false);
    setStage("review");
    setSession(null);
    setFundingCheck(null);
  }

  const budgetLabel = `${agent.pricing.amount} $U`;
  const needsU = fundingCheck ? fundingCheck.balanceRaw < fundingCheck.requiredRaw : true;
  const needsGas = fundingCheck ? !fundingCheck.hasGas : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg">Hire agent</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {stage === "wallet" && (
          <>
            <DialogHeader>
              <DialogTitle>Set up your hiring wallet</DialogTitle>
              <DialogDescription>
                Hiring runs on BNB Testnet through Altana ERC-8183 escrow.
                You need a passkey wallet to fund jobs — created once, no
                seed phrase. The header wallet is only for moving $U onto
                this hiring wallet.
              </DialogDescription>
            </DialogHeader>

            {walletError && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Couldn&apos;t set up a hiring wallet</AlertTitle>
                <AlertDescription>{walletError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
              <Fingerprint className="size-8 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your device will prompt for a fingerprint, face, or security
                key. The key never leaves your device — Altana never
                custodies it.
              </p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleCreateWallet}
                disabled={connecting || recovering}
                className="w-full"
              >
                {connecting && <Loader2 className="animate-spin" />}
                {connecting ? "Waiting for passkey..." : "Create Hiring Wallet"}
              </Button>
              <Button
                onClick={handleRecoverWallet}
                disabled={connecting || recovering}
                variant="outline"
                className="w-full"
              >
                {recovering && <Loader2 className="animate-spin" />}
                {recovering ? "Looking for your passkey..." : "Restore an existing hiring wallet"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "review" && wallet && (
          <>
            <DialogHeader>
              <DialogTitle>Hire {agent.name}</DialogTitle>
              <DialogDescription>{agent.tagline}</DialogDescription>
            </DialogHeader>

            {agent.endpointStatus === "unhealthy" && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Endpoint unhealthy</AlertTitle>
                <AlertDescription>
                  8004scan last saw this agent&apos;s A2A endpoint fail. You can
                  still fund a job; delivery may not arrive until the runtime
                  is back.
                </AlertDescription>
              </Alert>
            )}

            {agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-md border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Funds are held in escrow until the job is delivered and the
              dispute window passes.
            </p>

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

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                <span className="text-muted-foreground">Escrow budget</span>
                <span className="font-semibold text-foreground">{budgetLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                <span className="text-muted-foreground">Hiring wallet</span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                  {truncate(wallet.address)}
                  <CopyButton value={wallet.address} />
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleFund} className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {busy ? "Funding…" : "Fund & Hire"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "funding" && session && (
          <>
            <DialogHeader>
              <DialogTitle>Funding job escrow</DialogTitle>
              <DialogDescription>
                Checking your wallet&apos;s $U balance, then creating and
                funding the job on BNB Testnet — this is a real on-chain
                transaction through Altana&apos;s relay.
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
                {session.status === "FUNDED" ? (
                  <>
                    <CheckCircle2 className="size-5 text-success" />
                    Job funded
                  </>
                ) : session.status === "UNFUNDED" ? (
                  <>
                    <AlertTriangle className="size-5 text-destructive" />
                    {needsU && needsGas
                      ? "Your wallet needs $U and gas"
                      : needsGas
                        ? "Your wallet needs gas"
                        : "Your wallet needs $U"}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-5 text-destructive" />
                    Funding failed
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {session.status === "FUNDED" &&
                  `${agent.name} has been hired. Track progress from your dashboard.`}
                {session.status === "UNFUNDED" && needsGas && (
                  <>
                    Your hiring wallet needs a little tBNB to cover gas for
                    the one on-chain step the relay doesn&apos;t sponsor
                    (approving $U). Fund it, then try again — nothing was
                    charged.
                  </>
                )}
                {session.status === "UNFUNDED" && !needsGas && needsU && (
                  "Your hiring wallet doesn't have enough $U on BNB Testnet to cover this job yet. Fund it, then try again — nothing was charged."
                )}
                {session.status === "FAILED" &&
                  (session.error ||
                    "The relay couldn't settle the funding transaction. No funds were moved.")}
              </DialogDescription>
            </DialogHeader>

            {session.status === "UNFUNDED" && wallet && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                  <span className="text-muted-foreground">
                    Send {needsU && needsGas ? "$U + tBNB" : needsGas ? "tBNB" : "$U"} to
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                    {truncate(wallet.address)}
                    <CopyButton value={wallet.address} />
                  </span>
                </div>
                {needsU && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                    <span className="text-muted-foreground">$U needed</span>
                    <span className="font-semibold text-foreground">{budgetLabel}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {needsU && (
                    <a
                      href={TESTNET_U_FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Get testnet $U
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  {needsGas && (
                    <a
                      href={TESTNET_GAS_FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Get testnet BNB for gas
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                {needsU && isConnected && connectedAddress && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      Already have $U in your connected wallet ({truncate(connectedAddress)})?
                      Send it straight to your hiring wallet:
                    </p>
                    {sendError && (
                      <p className="text-xs text-destructive">{sendError}</p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleSendFromConnectedWallet}
                      disabled={sending || confirmingSend}
                    >
                      {(sending || confirmingSend) && <Loader2 className="animate-spin" />}
                      {sending
                        ? "Confirm in wallet..."
                        : confirmingSend
                          ? "Sending..."
                          : `Send ${budgetLabel} from connected wallet`}
                      {!sending && !confirmingSend && <ArrowRight className="size-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {session.status === "FUNDED" && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                  <span className="text-muted-foreground">Status</span>
                  <SessionStatusBadge status={session.status} />
                </div>
                {session.jobId && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                    <span className="text-muted-foreground">Job ID</span>
                    <span className="font-mono text-xs text-foreground">#{session.jobId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5">
                  <span className="text-muted-foreground">Escrowed</span>
                  <span className="font-semibold text-foreground">
                    {formatUnits(BigInt(session.budget), 18)} $U
                  </span>
                </div>
                {session.txHash && (
                  <a
                    href={explorerTxUrl(session.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View transaction on BscScan
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            )}

            <DialogFooter>
              {session.status === "FUNDED" ? (
                <Button onClick={() => setOpen(false)} className="w-full">
                  Done
                </Button>
              ) : (
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
