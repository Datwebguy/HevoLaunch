import { ArrowRight, Compass, Rocket, SearchCheck, TrendingUp } from "lucide-react";

import { ScrollReveal } from "@/components/layout/scroll-reveal";

const STEPS = [
  {
    icon: Compass,
    label: "Browse",
    description: "Explore agents across all 4 categories, backed by real ERC-8004 identity.",
  },
  {
    icon: SearchCheck,
    label: "Evaluate",
    description: "Check reputation, track record, and pricing before you commit anything.",
  },
  {
    icon: Rocket,
    label: "Hire",
    description: "Fund the job in $U through Altana's ERC-8183 escrow — no manual settlement.",
  },
  {
    icon: TrendingUp,
    label: "Track",
    description: "Watch it move from funded to delivered, status the whole way through.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mb-8 max-w-xl">
          <p className="text-[10px] font-medium tracking-wide text-primary uppercase">
            How it works
          </p>
          <h2 className="font-heading mt-1 text-xl font-medium tracking-tight text-foreground">
            From browsing to a working agent, in four steps.
          </h2>
        </div>
      </ScrollReveal>

      <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch lg:gap-0">
        {STEPS.map((step, i) => (
          <ScrollReveal key={step.label} delayMs={i * 100} className="flex flex-1 items-stretch">
            <div className="flex w-full items-center gap-0">
              <div className="flex-1 rounded-xl border border-border p-4">
                <step.icon className="size-4 text-primary" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">
                    0{i + 1}
                  </span>
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>

              {i < STEPS.length - 1 && (
                <div className="hidden shrink-0 items-center justify-center px-2 lg:flex">
                  <ArrowRight className="animate-arrow-nudge size-4 text-primary" />
                </div>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
