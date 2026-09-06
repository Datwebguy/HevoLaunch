"use client";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Top Center Ethereal Spotlight (BNB Gold / Amber Glow) */}
      <div className="absolute -top-[160px] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-primary/14 via-amber-500/8 to-transparent blur-[160px] rounded-full pointer-events-none" />

      {/* Right Subtle Aurora Glow (Teal / Emerald accent) */}
      <div className="absolute top-[350px] -right-[200px] w-[600px] h-[600px] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] blur-[180px] rounded-full pointer-events-none" />
      
      {/* Left Deep Ambient Glow */}
      <div className="absolute bottom-[100px] -left-[200px] w-[600px] h-[500px] bg-primary/[0.05] dark:bg-primary/[0.03] blur-[180px] rounded-full pointer-events-none" />
    </div>
  );
}
