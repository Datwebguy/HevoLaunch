"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface HevoLogoProps {
  size?: number;
  className?: string;
  variant?: "image" | "vector";
}

/**
 * HevoLogo component rendering the signature 4-dice 2x2 grid spelling "HEVO"
 * with alternating BNB Gold (#F0B90B) and Deep Obsidian (#080C14 / #101522).
 */
export function HevoLogo({ size = 32, className, variant = "image" }: HevoLogoProps) {
  if (variant === "image") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg shadow-xs border border-border/60 group-hover:scale-105 transition-transform shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src="/hevo-logo.jpg"
          alt="HevoLaunch Logo"
          width={size * 2}
          height={size * 2}
          className="w-full h-full object-cover rounded-lg"
          priority
        />
      </div>
    );
  }

  // Vector / CSS fallback representation
  return (
    <div
      className={cn(
        "grid grid-cols-2 grid-rows-2 p-0.5 gap-0.5 rounded-lg bg-[#080C14] border border-[#1D2538] shadow-xs select-none shrink-0 group-hover:scale-105 transition-transform",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="HEVO Logo"
    >
      {/* 1st Dice: H (Gold with dark text) */}
      <div className="flex items-center justify-center rounded-[3px] bg-[#F0B90B] text-[#080C14] font-black text-[9px] leading-none shadow-xs">
        H
      </div>
      {/* 2nd Dice: E (Obsidian with glowing gold text) */}
      <div className="flex items-center justify-center rounded-[3px] bg-[#161C2C] text-[#F0B90B] font-black text-[9px] leading-none border border-[#F0B90B]/30 shadow-xs">
        E
      </div>
      {/* 3rd Dice: V (Obsidian with glowing gold text) */}
      <div className="flex items-center justify-center rounded-[3px] bg-[#161C2C] text-[#F0B90B] font-black text-[9px] leading-none border border-[#F0B90B]/30 shadow-xs">
        V
      </div>
      {/* 4th Dice: O (Gold with dark text) */}
      <div className="flex items-center justify-center rounded-[3px] bg-[#F0B90B] text-[#080C14] font-black text-[9px] leading-none shadow-xs">
        O
      </div>
    </div>
  );
}

