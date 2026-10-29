import type { Metadata } from "next";
import { messagesFor, openGraphLocale, type Locale } from "@/i18n/config";

const shareImage = "/share/nelo-share.png";

export function siteMetadataBase() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function iconMetadata(): Metadata["icons"] {
  return {
    icon: [
      { url: "/favicon.ico" },
      { url: "/share/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/share/apple-icon-180.png" }],
  };
}

export function publicShareMetadata(locale: Locale, title: string, description: string): Metadata {
  const messages = messagesFor(locale);
  const image = {
    url: shareImage,
    width: 1200,
    height: 630,
    alt: messages.site.name,
  };
  return {
    metadataBase: siteMetadataBase() ?? undefined,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: openGraphLocale(locale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}
