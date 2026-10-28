import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale, messagesFor } from "@/i18n/config";
import { OperatorLocaleSwitch } from "./locale-switch";

function segmentFrom(pathname: string): "sign-in" | "totp" | "overview" {
  if (pathname.endsWith("/overview")) return "overview";
  if (pathname.endsWith("/totp")) return "totp";
  return "sign-in";
}

export default async function OperatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = messagesFor(locale);
  const pathname = (await headers()).get("x-pathname") ?? "";
  return (
    <>
      <header className="site-bar">
        {/* CSP has no style-src, and next/image writes an inline style. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="site-mark"
          src="/mark/nel-mark.png"
          alt={messages.a11y.mark}
          width={537}
          height={752}
        />
        <div>
          <p className="site-name">{messages.site.name}</p>
          <p>{messages.site.campaignTitle}</p>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <OperatorLocaleSwitch locale={locale} segment={segmentFrom(pathname)} />
      </footer>
    </>
  );
}
