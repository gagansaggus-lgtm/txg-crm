import type { Metadata } from "next";
import { Nunito_Sans, Manrope, DM_Sans } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TXG Vector — Transway Xpress Global",
  description:
    "ePowering fulfillment globally. Operations platform for warehousing, fulfillment, last-mile, and international courier.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full bg-[var(--app-bg)] antialiased",
        nunito.variable,
        manrope.variable,
        dmSans.variable,
      )}
    >
      <body className="min-h-full bg-[var(--app-bg)] text-[var(--ink-950)]">{children}</body>
    </html>
  );
}
