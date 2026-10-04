import type { Metadata, Viewport } from "next";
import { Readex_Pro } from "next/font/google";
import { siteConfig } from "@/config/site";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/**
 * Brand typeface "Neue Power" (see identity PDF) is a trial licence and not licensed for web use.
 * Readex Pro (OFL) is the web fallback: geometric, wide-set like the identity, with first-class Arabic.
 * Swap in licensed Neue Power webfonts via next/font/local when available (Latin headings only).
 */
const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "ديم هيلث | فيتامينات ومكملات غذائية في العراق",
    template: "%s | ديم هيلث",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "Deem Health" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#200b2c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={readex.variable}>
      <body className="min-h-dvh antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
