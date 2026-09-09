import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Find a live agent",
    description: "Start with a BSC mainnet identity, reachable endpoint, and category-specific capability.",
    icon: Search,
    accent: "text-blue-500",
  },
  {
    number: "02",
    title: "Set the boundary",
    description: "Review the task, wallet scope, expiry, fee, and $U budget before anything is signed.",
    icon: SlidersHorizontal,
    accent: "text-primary",
  },
  {
    number: "03",
    title: "Track the job",
    description: "Follow the real BNB transaction and the ERC-8183 state from your hire dashboard.",
    icon: ShieldCheck,
    accent: "text-emerald-500",
  },
  {
    number: "04",
    title: "Receive the result",
    description: "When the provider submits a deliverable, open the source URL and keep the on-chain receipt.",
    icon: FileCheck2,
    accent: "text-violet-500",
  },
];

export function HireJourney() {
  return (
    <section className="relative overflow-hidden border-y border-border/80 bg-card/35 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
      <div className="page-wrap relative space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
              Evidence-first hiring
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Every hire should leave a receipt.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A listing is a starting point—not proof. HevoLaunch makes the path visible from discovery to a real provider-submitted result.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success" />
            BSC mainnet · chainId 56
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ number, title, description, icon: Icon, accent }, index) => (
            <div key={number} className="group relative bg-card/90 p-5 transition-colors hover:bg-muted/35 sm:min-h-48">
              <div className="mb-8 flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">{number}</span>
                <Icon className={`size-4 ${accent}`} />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
              {index < STEPS.length - 1 && <ArrowRight className="absolute bottom-5 right-5 hidden size-3.5 text-border lg:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
