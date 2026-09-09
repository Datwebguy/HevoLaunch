import { Compass, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    label: "Browse & Discover",
    icon: Compass,
    description: "Explore curated agent desks and live on-chain ERC-8004 tokens on BNB Chain.",
  },
  {
    n: "02",
    label: "Verify & Quote",
    icon: ShieldCheck,
    description: "Review 8004scan identity, endpoint health, and the provider's current quote.",
  },
  {
    n: "03",
    label: "Lock Escrow in $U",
    icon: Lock,
    description: "Deposit $U into the Altana ERC-8183 escrow contract via Passkey or MetaMask.",
  },
  {
    n: "04",
    label: "Automated Delivery",
    icon: CheckCircle2,
    description: "Agent executes analysis non-custodially and submits deliverable to your job dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section className="page-wrap py-12 sm:py-16 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
          Simple & Non-Custodial
        </p>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          How Hiring Works
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="rounded-xl border border-border/80 bg-card/80 p-5 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {step.n}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {step.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
