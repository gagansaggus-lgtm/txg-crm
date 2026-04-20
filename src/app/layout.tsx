import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TXG CRM",
  description: "Transway Xpress Global — CRM + light ops layer for warehousing, fulfillment, last-mile, and international courier.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full bg-[var(--app-bg)] antialiased">
      <body className="min-h-full bg-[var(--app-bg)] text-[var(--ink-950)]">{children}</body>
    </html>
  );
}
