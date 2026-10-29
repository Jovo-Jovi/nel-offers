import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "معامل النيل مصر",
    template: "%s | معامل النيل مصر",
  },
  description: "دليل العروض الإلكترونية لمعامل النيل مصر",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-bg text-dark antialiased`}>{children}</body>
    </html>
  );
}
