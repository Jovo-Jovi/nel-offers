import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { directionFor, isLocale, messagesFor } from "@/i18n/config";
import { iconMetadata, siteMetadataBase } from "@/lib/share-metadata";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const messages = messagesFor(locale);
  return {
    metadataBase: siteMetadataBase() ?? undefined,
    title: `${messages.site.campaignTitle} — ${messages.site.name}`,
    icons: iconMetadata(),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      data-locale={locale}
      nonce={nonce}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
