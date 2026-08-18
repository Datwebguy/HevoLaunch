import type { Metadata } from "next";
import { Geist_Mono, Tomorrow } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { Providers } from "@/components/providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tomorrow = Tomorrow({
  variable: "--font-tomorrow",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HevoLaunch — The Agent Marketplace for BNB Chain",
  description:
    "Discover, evaluate, and hire AI agents on BNB Smart Chain. Rebalancing, Grid Trading, Yield Optimisation, and Health Factor Monitoring agents — built with BNB Agent Studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${tomorrow.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col text-foreground">
        <AmbientBackground />
        <Providers>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
