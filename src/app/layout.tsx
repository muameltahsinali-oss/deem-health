import type { Metadata, Viewport } from "next";
import { Readex_Pro } from "next/font/google";
import "./globals.css";

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ديم هيلث | متجر الفيتامينات والمكملات الغذائية في العراق",
  description: "متجر ديم هيلث الإلكتروني للمكملات الغذائية والفيتامينات الأصلية داخل العراق. دفع عند الاستلام وتوصيل سريع لكافة المحافظات.",
  keywords: ["ديم هيلث", "مكملات غذائية العراق", "فيتامينات بغداد", "بروتين العراق", "كولاجين", "صحة وعافية"],
  openGraph: {
    title: "ديم هيلث | فيتامينات ومكملات غذائية أصلية في العراق",
    description: "منتجات صحية أصلية 100% مع ضمان الجودة وخدمة التوصيل السريع والدفع عند الاستلام لكافة المحافظات العراقية.",
    locale: "ar_IQ",
    type: "website",
    siteName: "ديم هيلث - Deem Health",
  },
  icons: {
    icon: "/brand/deem-mark.svg",
    apple: "/brand/deem-mark.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#200b2c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={readex.variable}>
      <body className="min-h-screen flex flex-col bg-[#fbf9fc] text-[#200b2c]">
        {children}
      </body>
    </html>
  );
}
