/**
 * Fixed decorative layer behind the whole app: a faint drifting grid plus
 * a slow-moving gold glow. Keeps the canvas from reading as perfectly flat
 * while staying out of the way — pointer-events: none, low opacity, no
 * interference with content contrast or focus states.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="bg-grid absolute inset-0 opacity-[0.35]" />
      <div className="bg-glow absolute -top-1/4 -left-1/4 size-[70vw] rounded-full bg-primary/[0.10] blur-[120px]" />
      <div
        className="bg-glow absolute -right-1/4 -bottom-1/4 size-[60vw] rounded-full bg-primary/[0.06] blur-[140px]"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}
