import type { Metadata } from "next";
import "./globals.css";

// Self-hosted fonts (npm @fontsource) so the build never needs to reach
// Google Fonts at compile time. Families: "Outfit Variable", "Syne Variable",
// "IBM Plex Mono". Loaded once here; CSS vars are declared in globals.css.
import "@fontsource-variable/outfit";
import "@fontsource-variable/syne";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "HevoLaunch — Hire agents on BNB Chain",
  description:
    "Discover, evaluate, and hire AI agents on BNB Smart Chain. Rebalancing, grid trading, yield optimisation, and health-factor monitoring — built with BNB Agent Studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ErrorBoundary>
          <Providers>
            <SiteHeader />
            <main id="main" className="flex flex-1 flex-col">
              {children}
            </main>
            <SiteFooter />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
