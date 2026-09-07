"use client";

import { useEffect, useRef, useState } from "react";
import { erc20Abi, formatUnits, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bsc } from "wagmi/chains";
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
  clearStoredHiringWallet,
  createFreshPasskeyWallet,
  createInstantHiringWallet,
  createOrLoadHiringWallet,
  explorerTxUrl,
  fundHireSession,
  getStoredHiringWallet,
  PAYMENT_TOKEN_ADDRESS,
  recoverHiringWallet,
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
  // via wagmi) — a completely different address from the Altana smart account
  // hiring wallet above. Funding a job requires the LATTER; this lets a
  // user move $U they already hold in the FORMER over in one click instead
  // of manually copying addresses between two wallets.
  const fundingLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const { address: connectedAddress, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: sending, reset: resetSend } = useWriteContract();
  const { sendTransactionAsync, isPending: sendingGas } = useSendTransaction();
  const [sendHash, setSendHash] = useState<`0x${string}` | undefined>(undefined);
  const [sendError, setSendError] = useState<string | null>(null);
  const { isLoading: confirmingSend, isSuccess: sendConfirmed } = useWaitForTransactionReceipt({
    hash: sendHash,
    chainId: bsc.id,
  });

  useEffect(() => {
    // Reacting to an external system (the chain confirming this transfer),
    // not synchronizing derived render state — the sanctioned effect case.
    if (sendConfirmed) {
      if (wallet) {
        checkFunding(wallet, parseUnits(String(agent.pricing.amount), 18))
          .then((check) => setFundingCheck(check))
          .catch(() => {});
      }
      if (stage === "result" && session?.status === "UNFUNDED") {
        handleRetry();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSendHash(undefined);
      resetSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendConfirmed]);

  async function handleSendFromConnectedWallet() {
    if (!wallet) return;
    setSendError(null);
    try {
      if (connectedChainId !== bsc.id) {
        await switchChainAsync({ chainId: bsc.id });
      }
      const transferAmount = session
        ? BigInt(session.budget)
        : parseUnits(String(agent.pricing.amount), 18);
      const hash = await writeContractAsync({
        address: PAYMENT_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [wallet.address, transferAmount],
        chainId: bsc.id,
      });
      setSendHash(hash);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Transfer was rejected or failed.");
    }
  }

  async function handleSendGasFromConnectedWallet() {
    if (!wallet) return;
    setSendError(null);
    try {
      if (connectedChainId !== bsc.id) {
        await switchChainAsync({ chainId: bsc.id });
      }
      const hash = await sendTransactionAsync({
        to: wallet.address,
        value: parseEther("0.005"),
        chainId: bsc.id,
      });
      setSendHash(hash);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Gas transfer was rejected or failed.");
    }
  }

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;

    setSession(null);
    setWalletError(null);

    const existing = getStoredHiringWallet(connectedAddress);
    if (!existing) {
      setStage("wallet");
      return;
    }

    const result = await createOrLoadHiringWallet(connectedAddress);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
      checkFunding(result.wallet, parseUnits(String(agent.pricing.amount), 18))
        .then((check) => setFundingCheck(check))
        .catch(() => {});
    } else {
      setWalletError(result.error);
      setStage("wallet");
    }
  }

  function handleDisconnectHiringWallet() {
    clearStoredHiringWallet(connectedAddress);
    setWallet(null);
    setSigner(null);
    setFundingCheck(null);
    setSession(null);
    setStage("wallet");
    setWalletError(null);
  }

  async function handleCreateInstantWallet() {
    setConnecting(true);
    setWalletError(null);
    const result = await createInstantHiringWallet(connectedAddress);
    setConnecting(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
      checkFunding(result.wallet, parseUnits(String(agent.pricing.amount), 18))
        .then((check) => setFundingCheck(check))
        .catch(() => {});
    } else {
      setWalletError(result.error);
    }
  }

  async function handleCreatePasskeyWallet() {
    setConnecting(true);
    setWalletError(null);
    const result = await createFreshPasskeyWallet(connectedAddress);
    setConnecting(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
      checkFunding(result.wallet, parseUnits(String(agent.pricing.amount), 18))
        .then((check) => setFundingCheck(check))
        .catch(() => {});
    } else {
      setWalletError(result.error);
    }
  }

  async function handleRecoverWallet() {
    setRecovering(true);
    setWalletError(null);
    const result = await recoverHiringWallet(connectedAddress);
    setRecovering(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
      checkFunding(result.wallet, parseUnits(String(agent.pricing.amount), 18))
        .then((check) => setFundingCheck(check))
        .catch(() => {});
    } else {
      setWalletError(result.error);
    }
  }

  async function handleResetAndCreateFreshWallet() {
    setConnecting(true);
    setWalletError(null);
    const result = await createInstantHiringWallet(connectedAddress);
    setConnecting(false);
    if (result.ok) {
      setWallet(result.wallet);
      setSigner(result.signer);
      setStage("review");
      setSession(null);
      setFundingCheck(null);
    } else {
      setWalletError(result.error);
      setStage("wallet");
    }
  }

  async function handleFund() {
    if (!wallet || !signer || fundingLock.current) return;
    fundingLock.current = true;
    setBusy(true);
    const draft = buildHireSession(agent, wallet.address, task, connectedAddress as `0x${string}` | undefined);
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
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <span>Initialize Hiring Smart Account</span>
              </DialogTitle>
              <DialogDescription>
                Hiring runs non-custodially on BNB Smart Chain via Altana ERC-8183 escrow.
                Creates an instant smart account to sign escrow intents with 0 gas and 0 seed phrases.
              </DialogDescription>
            </DialogHeader>

            {walletError && (
              <Alert variant="destructive" className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <AlertTitle className="text-xs font-semibold">Setup notice</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">{walletError}</AlertDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs mt-1 bg-background/60 hover:bg-background"
                  onClick={handleCreateInstantWallet}
                  disabled={connecting}
                >
                  {connecting ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
                  Create 1-Click Smart Account Now
                </Button>
              </Alert>
            )}

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Instant 1-Click Setup</span>
              </div>
              <p>
                Clicking <strong>&quot;Create 1-Click Smart Account&quot;</strong> sets up your non-custodial smart account in seconds without browser sign-in prompts or seed phrases.
              </p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col pt-1">
              <Button
                onClick={handleCreateInstantWallet}
                disabled={connecting || recovering}
                className="w-full font-medium"
              >
                {connecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Initializing smart account...</span>
                  </>
                ) : (
                  <span>Create 1-Click Smart Account (Instant)</span>
                )}
              </Button>
              <Button
                onClick={handleCreatePasskeyWallet}
                disabled={connecting || recovering}
                variant="outline"
                className="w-full text-xs"
              >
                <Fingerprint className="size-3.5 mr-1.5 text-primary" />
                <span>Or use Hardware Passkey (Windows Hello / Touch ID)</span>
              </Button>
              <Button
                onClick={handleRecoverWallet}
                disabled={connecting || recovering}
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                {recovering ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    <span>Searching device keychain...</span>
                  </>
                ) : (
                  <span>Restore on-chain passkey from keychain</span>
                )}
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
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-medium">Hiring Smart Account</span>
                    <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium px-1.5 py-0.5">
                      {wallet.type === "passkey" ? "Passkey Linked" : "1-Click Smart Account"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                    {truncate(wallet.address)}
                    <CopyButton value={wallet.address} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                  <span>
                    {wallet.type === "passkey" ? "Biometric prompt at funding" : "Non-custodial smart execution"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetAndCreateFreshWallet}
                      className="text-primary hover:underline"
                      disabled={busy || connecting}
                    >
                      {connecting ? "Creating..." : "New Account"}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleDisconnectHiringWallet}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={busy || connecting}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>

              {fundingCheck && (
                <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Smart Account Balance</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {formatUnits(fundingCheck.balanceRaw, 18).slice(0, 6)} $U • {formatUnits(fundingCheck.nativeBalanceRaw, 18).slice(0, 6)} tBNB
                    </span>
                  </div>

                  {(needsU || needsGas) && isConnected && connectedAddress ? (
                    <div className="border-t border-border/60 pt-2 space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Deposit from connected wallet ({truncate(connectedAddress)}):
                      </p>
                      {sendError && (
                        <p className="text-[11px] text-destructive">{sendError}</p>
                      )}
                      <div className="flex flex-col gap-1.5">
                        {needsU && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full justify-between text-xs h-8"
                            onClick={handleSendFromConnectedWallet}
                            disabled={sending || sendingGas || confirmingSend}
                          >
                            <span>
                              {sending ? "Confirm $U in wallet..." : confirmingSend ? "Sending $U..." : `Deposit ${budgetLabel} from MetaMask`}
                            </span>
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                        {needsGas && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full justify-between text-xs h-8"
                            onClick={handleSendGasFromConnectedWallet}
                            disabled={sending || sendingGas || confirmingSend}
                          >
                            <span>
                              {sendingGas ? "Confirm tBNB in wallet..." : confirmingSend ? "Sending tBNB..." : "Deposit 0.01 tBNB Gas from MetaMask"}
                            </span>
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
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
                funding the job on BNB Smart Chain — this is a real on-chain
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
                    Your hiring wallet needs a little BNB to cover gas for
                    the one on-chain step the relay doesn&apos;t sponsor
                    (approving $U). Fund it, then try again — nothing was
                    charged.
                  </>
                )}
                {session.status === "UNFUNDED" && !needsGas && needsU && (
                  "Your hiring wallet doesn't have enough $U on BNB Smart Chain to cover this job yet. Fund it, then try again — nothing was charged."
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
                    Send {needsU && needsGas ? "$U + BNB" : needsGas ? "BNB" : "$U"} to
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
                      href="https://bscscan.com/token/0xcE24439F2D9C6a2289F741120FE202248B666666"
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View $U Token on BscScan
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                {(needsU || needsGas) && isConnected && connectedAddress && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      Transfer directly from your connected wallet ({truncate(connectedAddress)}) to your hiring wallet:
                    </p>
                    {sendError && (
                      <p className="text-xs text-destructive">{sendError}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      {needsU && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleSendFromConnectedWallet}
                          disabled={sending || sendingGas || confirmingSend}
                        >
                          {(sending || confirmingSend) && <Loader2 className="animate-spin" />}
                          {sending
                            ? "Confirm $U in wallet..."
                            : confirmingSend
                              ? "Sending $U..."
                              : `Send ${budgetLabel} from connected wallet`}
                          {!sending && !confirmingSend && <ArrowRight className="size-3.5" />}
                        </Button>
                      )}
                      {needsGas && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleSendGasFromConnectedWallet}
                          disabled={sending || sendingGas || confirmingSend}
                        >
                          {(sendingGas || confirmingSend) && <Loader2 className="animate-spin" />}
                          {sendingGas
                            ? "Confirm tBNB in wallet..."
                            : confirmingSend
                              ? "Sending tBNB..."
                              : "Send 0.01 tBNB gas from connected wallet"}
                          {!sendingGas && !confirmingSend && <ArrowRight className="size-3.5" />}
                        </Button>
                      )}
                    </div>
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

            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              {session.status === "FUNDED" ? (
                <Button onClick={() => setOpen(false)} className="w-full">
                  Done
                </Button>
              ) : session.status === "FAILED" ? (
                <>
                  <Button
                    onClick={handleResetAndCreateFreshWallet}
                    className="w-full"
                    disabled={connecting}
                  >
                    {connecting && <Loader2 className="animate-spin" />}
                    {connecting ? "Setting up fresh wallet..." : "Create Fresh Registered Wallet"}
                  </Button>
                  <Button onClick={handleRetry} className="w-full" variant="outline">
                    Try Again
                  </Button>
                </>
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
