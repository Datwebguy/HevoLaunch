/**
 * Rarible spec, verbatim: "Don't add gradients, glassmorphism, or
 * decorative backgrounds to content areas. The canvas is always flat
 * #0a0a0a." Page background is already flat via `bg-background` on
 * `body` in globals.css — this component intentionally renders nothing.
 * Kept as a component (rather than deleted outright) only so layout.tsx
 * doesn't need touching if a future non-decorative use appears.
 */
export function AmbientBackground() {
  return null;
}
