import type { Metadata } from "next";
import { Manrope, Playfair_Display, Geist } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TXG CRM — Transway Xpress Global",
  description:
    "ePowering fulfillment globally. CRM + ops for warehousing, fulfillment, last-mile, and international courier.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "bg-[var(--app-bg)]", "antialiased", manrope.variable, playfair.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full bg-[var(--app-bg)] text-[var(--ink-950)]">{children}</body>
    </html>
  );
}
