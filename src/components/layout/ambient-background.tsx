"use client";

export function AmbientBackground() {
  return (
    <div className="ambient-background pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="ambient-grid absolute inset-0" />
      <div className="ambient-orbit ambient-orbit-gold absolute -top-48 left-[12%] size-[34rem] rounded-full" />
      <div className="ambient-orbit ambient-orbit-blue absolute top-[24%] -right-56 size-[38rem] rounded-full" />
      <div className="ambient-orbit ambient-orbit-teal absolute bottom-[-18rem] left-[28%] size-[32rem] rounded-full" />
      <div className="ambient-scanline absolute inset-x-0 top-0 h-px" />
    </div>
  );
}
