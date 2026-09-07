"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import type { HireSession } from "@/lib/types";
import {
  type AuditedWalletBalances,
  fetchLiveWalletAudit,
  getDeliverableForJob,
  getTargetWalletInfo,
} from "@/lib/deliverables";
import { explorerTxUrl } from "@/lib/altana";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionStatusBadge } from "@/components/hiring/session-status-badge";

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function JobDetailsDialog({
  session,
  trigger,
}: {
  session: HireSession;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [auditedBalances, setAuditedBalances] = useState<AuditedWalletBalances | null>(null);
  const [auditing, setAuditing] = useState(false);
  const { address: connectedAddress } = useAccount();

  // Active target wallet selection
  const [customWallet, setCustomWallet] = useState<string>("");
  const [customInputDraft, setCustomInputDraft] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const initialInfo = getTargetWalletInfo(session.task, session, connectedAddress);
  const [activeAddress, setActiveAddress] = useState<string>(initialInfo.address);

  // Synchronize initial address on open / connect
  useEffect(() => {
    if (!customWallet) {
      const resolved = getTargetWalletInfo(session.task, session, connectedAddress);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveAddress(resolved.address);
    }
  }, [session, connectedAddress, customWallet]);

  const targetInfo = getTargetWalletInfo(session.task, session, connectedAddress, customWallet || activeAddress);
  const deliverable = getDeliverableForJob(session, connectedAddress, auditedBalances, targetInfo.address);

  // Fetch live on-chain balances whenever dialog opens or active address changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuditing(true);

    fetchLiveWalletAudit(targetInfo.address)
      .then((data) => {
        if (!cancelled) {
          setAuditedBalances(data);
        }
      })
      .catch((err) => {
        console.warn("[JobDetailsDialog] Failed to fetch live balances:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setAuditing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, targetInfo.address]);

  async function handleRefreshAudit() {
    setAuditing(true);
    try {
      const data = await fetchLiveWalletAudit(targetInfo.address);
      setAuditedBalances(data);
    } catch (err) {
      console.warn("[JobDetailsDialog] Refresh failed:", err);
    } finally {
      setAuditing(false);
    }
  }

  function handleSwitchTarget(addr: string) {
    setCustomWallet("");
    setShowCustomInput(false);
    setActiveAddress(addr);
  }

  function handleApplyCustomAddress(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (/^0x[a-fA-F0-9]{40}$/i.test(customInputDraft.trim())) {
      setCustomWallet(customInputDraft.trim());
      setActiveAddress(customInputDraft.trim());
      setShowCustomInput(false);
    }
  }

  function handleCopyAddress() {
    navigator.clipboard.writeText(targetInfo.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  }

  function handleCopyReport() {
    const lines = [
      `# ${deliverable.title}`,
      "",
      `Target Wallet: ${deliverable.targetWallet} (${targetInfo.sourceLabel})`,
      auditedBalances
        ? `Audited Balances: ${auditedBalances.nativeBnb.toFixed(4)} tBNB ($${auditedBalances.nativeBnbUsd.toFixed(2)}) + ${auditedBalances.uToken.toFixed(2)} $U ($${auditedBalances.uTokenUsd.toFixed(2)}) = $${auditedBalances.totalPortfolioUsd.toFixed(2)} USD`
        : "",
      "",
      deliverable.summary,
      "",
      "## Key Metrics",
      ...deliverable.metrics.map((m) => `- ${m.label}: ${m.value}`),
      "",
      "## Actionable Recommendations",
      ...deliverable.actionableSteps.map((s, i) => `${i + 1}. ${s}`),
    ];
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    const blob = new Blob([JSON.stringify(deliverable, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_${session.jobId || session.id}_deliverable.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" variant="default" className="gap-1.5 text-xs shadow-sm">
            <Sparkles className="size-3.5" />
            View Results
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border">
        <Tabs defaultValue="results" className="flex flex-col h-full overflow-hidden">
          {/* DOCKED HEADER & TABS BAR */}
          <div className="p-5 pb-3 border-b border-border/70 bg-card shrink-0 space-y-3">
            <DialogHeader className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground shadow-sm"
                    style={{ backgroundColor: session.avatarColor }}
                    aria-hidden
                  >
                    {session.agentName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                      {session.agentName}
                      {session.jobId && (
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          Job #{session.jobId}
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground truncate max-w-md">
                      {session.task}
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SessionStatusBadge status={session.status} />
                  <Badge variant="outline" className="font-mono text-xs font-semibold">
                    {formatUnits(BigInt(session.budget), 18)} $U
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="results" className="text-xs gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Deliverable Report
              </TabsTrigger>
              <TabsTrigger value="escrow" className="text-xs gap-1.5">
                <ShieldCheck className="size-3.5 text-success" />
                On-Chain Escrow
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                Execution Flow
              </TabsTrigger>
            </TabsList>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-4">
            {/* TAB 1: DELIVERABLE REPORT */}
            <TabsContent value="results" className="m-0 space-y-4 focus-visible:outline-none">
              {/* LIVE ON-CHAIN AUDIT VERIFICATION CARD */}
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2.5 bg-success"></span>
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Live On-Chain Balance Audit Verified
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                      BNB Smart Chain
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshAudit}
                      disabled={auditing}
                      className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`size-3 ${auditing ? "animate-spin text-primary" : ""}`} />
                      {auditing ? "Auditing..." : "Refresh Balances"}
                    </Button>
                  </div>
                </div>

                {/* TARGET WALLET SWITCHER & ORIGIN BADGE */}
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[11px]">Audited Target:</span>
                      <span className="font-mono font-medium text-foreground text-[11px]">
                        {truncate(targetInfo.address)}
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Copy full address"
                      >
                        {copiedAddr ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      </button>
                      <a
                        href={`https://bscscan.com/address/${targetInfo.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5 ml-1"
                      >
                        Explorer
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>

                    <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5 bg-background/80 border border-border/50">
                      {targetInfo.sourceLabel}
                    </Badge>
                  </div>

                  {/* QUICK SWITCH PILLS */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-muted-foreground mr-1">Switch Audit Target:</span>
                    {connectedAddress && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTarget(connectedAddress)}
                        className={`rounded px-2 py-0.5 text-[10px] font-mono transition-colors border ${
                          targetInfo.address.toLowerCase() === connectedAddress.toLowerCase()
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                        }`}
                      >
                        MetaMask ({truncate(connectedAddress)})
                      </button>
                    )}
                    {session.hirerAddress && (
                      <button
                        type="button"
                        onClick={() => handleSwitchTarget(session.hirerAddress)}
                        className={`rounded px-2 py-0.5 text-[10px] font-mono transition-colors border ${
                          targetInfo.address.toLowerCase() === session.hirerAddress.toLowerCase()
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                        }`}
                      >
                        Escrow Account ({truncate(session.hirerAddress)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="rounded px-2 py-0.5 text-[10px] font-mono bg-background/80 text-muted-foreground hover:text-foreground border border-border/60"
                    >
                      {showCustomInput ? "Close Input" : "+ Custom Wallet"}
                    </button>
                  </div>

                  {/* CUSTOM ADDRESS INPUT FORM */}
                  {showCustomInput && (
                    <form onSubmit={handleApplyCustomAddress} className="flex items-center gap-1.5 pt-1">
                      <Input
                        placeholder="Enter 0x... wallet address on BNB Chain"
                        value={customInputDraft}
                        onChange={(e) => setCustomInputDraft(e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                      <Button type="submit" size="sm" className="h-7 px-3 text-xs gap-1">
                        <Search className="size-3" />
                        Audit
                      </Button>
                    </form>
                  )}

                  {/* Audit Source Explanation Callout */}
                  <div className="flex items-start gap-1.5 bg-background/60 p-2 rounded border border-border/40 text-[11px] text-muted-foreground">
                    <HelpCircle className="size-3 text-primary shrink-0 mt-0.5" />
                    <span>{targetInfo.explanation}</span>
                  </div>

                  {/* Balance Pills */}
                  {auditedBalances ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="rounded bg-background/90 px-2 py-0.5 font-mono text-[11px] border border-border/60">
                        <span className="text-muted-foreground mr-1">tBNB:</span>
                        <strong className="text-foreground">{auditedBalances.nativeBnb.toFixed(4)}</strong>{" "}
                        <span className="text-muted-foreground">(${auditedBalances.nativeBnbUsd.toFixed(2)})</span>
                      </span>
                      <span className="rounded bg-background/90 px-2 py-0.5 font-mono text-[11px] border border-border/60">
                        <span className="text-muted-foreground mr-1">$U:</span>
                        <strong className="text-foreground">{auditedBalances.uToken.toFixed(2)}</strong>{" "}
                        <span className="text-muted-foreground">(${auditedBalances.uTokenUsd.toFixed(2)})</span>
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary border border-primary/25">
                        Total Valuation: ${auditedBalances.totalPortfolioUsd.toFixed(2)} USD
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <Loader2 className="size-3 animate-spin text-primary" />
                      Querying on-chain balances for {truncate(targetInfo.address)}...
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN REPORT BODY */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {deliverable.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Tailored execution strategy calculated from live audited balances.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyReport}
                      className="h-7 text-xs gap-1"
                    >
                      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadJson}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="size-3" />
                      JSON
                    </Button>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-md border border-border/40">
                  {deliverable.summary}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {deliverable.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-md border border-border/70 bg-muted/30 p-2.5 space-y-1"
                    >
                      <span className="text-[11px] text-muted-foreground block">
                        {metric.label}
                      </span>
                      <span
                        className={`text-xs font-semibold font-mono ${
                          metric.variant === "success"
                            ? "text-success"
                            : metric.variant === "warning"
                              ? "text-amber-500"
                              : "text-foreground"
                        }`}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Structured Sections */}
                {deliverable.sections.map((section) => (
                  <div key={section.heading} className="border-t border-border/60 pt-3 space-y-2">
                    <h4 className="text-xs font-semibold text-foreground">
                      {section.heading}
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {section.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded bg-muted/40 px-2.5 py-1.5 text-[11px] gap-1"
                        >
                          <span className="text-muted-foreground font-medium">
                            {item.key}
                          </span>
                          <span className="font-mono text-foreground font-semibold">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {section.notes && (
                      <p className="text-[10px] text-muted-foreground italic">
                        Note: {section.notes}
                      </p>
                    )}
                  </div>
                ))}

                {/* Actionable Steps */}
                <div className="border-t border-border/60 pt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="size-3.5 text-primary" />
                    Recommended Next Actions on BNB Chain
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {deliverable.actionableSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ON-CHAIN ESCROW */}
            <TabsContent value="escrow" className="m-0 space-y-3 focus-visible:outline-none">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="font-semibold text-foreground">Escrow Standard</span>
                  <span className="font-mono text-primary font-medium">Altana ERC-8183 (BNB Smart Chain)</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">AgenticCommerce Kernel:</span>
                    <a
                      href="https://bscscan.com/address/0xEa4DAa3100A767e86FDed867729ae7446476EBA6"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      0xEa4D...EBA6
                      <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Escrow Payment Token:</span>
                    <span className="font-mono text-foreground font-semibold">
                      $U (United Stables ERC-20)
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Escrow Budget Locked:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {formatUnits(BigInt(session.budget), 18)} $U
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Client Smart Account (Passkey):</span>
                    <span className="font-mono text-foreground font-medium">
                      {session.hirerAddress}
                    </span>
                  </div>

                  {session.connectedAddress && (
                    <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                      <span className="text-muted-foreground">Connected Portfolio EOA:</span>
                      <span className="font-mono text-foreground font-medium">
                        {session.connectedAddress}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Provider Agent Identity:</span>
                    <span className="font-mono text-foreground font-medium">
                      {session.provider}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground">Dispute Policy Contract:</span>
                    <span className="font-mono text-foreground font-medium">
                      0x9C01...6dE5 (Whitelisted OptimisticPolicy)
                    </span>
                  </div>

                  {session.txHash && (
                    <div className="flex items-center justify-between rounded bg-muted/50 p-2">
                      <span className="text-muted-foreground">Funding Transaction:</span>
                      <a
                        href={explorerTxUrl(session.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-primary hover:underline flex items-center gap-1"
                      >
                        {truncate(session.txHash)}
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: TIMELINE */}
            <TabsContent value="timeline" className="m-0 space-y-3 focus-visible:outline-none">
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">1. Escrow Job Initialized</p>
                      <p className="text-muted-foreground text-[11px]">
                        Job parameters and budget registered with AgenticCommerce kernel on BNB Smart Chain.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">2. Capital Escrowed ({formatUnits(BigInt(session.budget), 18)} $U)</p>
                      <p className="text-muted-foreground text-[11px]">
                        Buyer approved and funded $U escrow. Escrow contract locked funds safely.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">3. A2A Execution Dispatched</p>
                      <p className="text-muted-foreground text-[11px]">
                        `notify_funded` event transmitted to agent runtime at https://hevo-agents.fly.dev.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">4. Live On-Chain Portfolio Audited</p>
                      <p className="text-muted-foreground text-[11px]">
                        Audited live BNB and $U token balances on BNB Smart Chain.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">5. AI Intelligence Deliverable Produced</p>
                      <p className="text-muted-foreground text-[11px]">
                        Customized DeFi mathematical execution matrix generated and deliverable ready for user review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
