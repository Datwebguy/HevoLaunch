"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="size-4 opacity-50" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="size-8 relative text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all rounded-lg"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="size-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="size-4 text-slate-700 transition-transform rotate-0 hover:-rotate-12" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-mono">
        {isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
