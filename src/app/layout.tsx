import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proposal Maker — quotes and proposals, exported to PDF",
  description:
    "Build client proposals and quotes (line items, pricing, terms) in French or English, preview them live, and export to PDF. Free, no account, your data stays in your browser.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:m-2 focus:bg-white focus:p-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
