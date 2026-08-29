const STEPS = [
  { n: "1", label: "Browse", description: "Open a category. Hire-ready agents sit above live 8004scan discovery." },
  { n: "2", label: "Evaluate", description: "Check the 8004scan score, identity, and $U price before you commit." },
  { n: "3", label: "Hire", description: "Fund an ERC-8183 job in $U from a passkey wallet on BNB Testnet." },
  { n: "4", label: "Track", description: "Watch the job go from funded to delivered under My hires." },
];

export function HowItWorks() {
  return (
    <section className="page-wrap py-10">
      <h2 className="font-heading text-xl font-semibold text-balance text-foreground">
        How hiring works
      </h2>
      <ol className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.label} className="bg-card p-4">
            <p className="font-mono text-xs tabular-nums text-muted-foreground">{step.n}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{step.label}</p>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
