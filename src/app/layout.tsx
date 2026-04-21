import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import "./globals.css";

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
      className={`${manrope.variable} ${playfair.variable} h-full bg-[var(--app-bg)] antialiased`}
    >
      <body className="min-h-full bg-[var(--app-bg)] text-[var(--ink-950)]">{children}</body>
    </html>
  );
}
