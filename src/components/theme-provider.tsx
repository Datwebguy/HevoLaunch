"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "hevolaunch-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored || "dark";
  } catch {
    return "dark";
  }
}

function getInitialResolved(initialTheme: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  if (initialTheme === "dark") return "dark";
  if (initialTheme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    getInitialResolved(getInitialTheme())
  );

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      const isDark =
        newTheme === "dark" ||
        (newTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      setResolvedTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system theme changes if set to system
  React.useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const isDark = mediaQuery.matches;
      setResolvedTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
