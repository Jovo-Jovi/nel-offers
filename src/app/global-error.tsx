"use client";

import Link from "next/link";
import { LatinRun } from "@/components/latin-run";
import { defaultLocale, directionFor, homePath, messagesFor, prefixedLocale } from "@/i18n/config";
import "./globals.css";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function GlobalError({ reset }: { error: unknown; reset: () => void }) {
  const arabic = messagesFor(defaultLocale);
  const english = messagesFor(prefixedLocale);
  return (
    <html lang={defaultLocale} dir={directionFor(defaultLocale)}>
      <body>
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-10">
          <h1 className="text-3xl font-bold leading-tight text-dark">{arabic.site.errorMessage}</h1>
          <p className="text-lg leading-relaxed text-dark">
            <LatinRun>{english.site.errorMessage}</LatinRun>
          </p>
          <button
            type="button"
            className={`inline-flex w-fit items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-bold text-surface ${focusRing}`}
            onClick={() => reset()}
          >
            <span>{arabic.site.tryAgain}</span>
            <LatinRun>{english.site.tryAgain}</LatinRun>
          </button>
          <Link
            href={homePath(defaultLocale)}
            className={`inline-flex w-fit items-center gap-2 text-sm font-bold text-primary no-underline ${focusRing}`}
          >
            <span>{arabic.site.name}</span>
            <LatinRun>{english.site.name}</LatinRun>
          </Link>
        </main>
      </body>
    </html>
  );
}
