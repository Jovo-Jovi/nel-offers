"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { defaultLocale, homePath, isLocale, messagesFor } from "@/i18n/config";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function localeFromParams(value: string | string[] | undefined) {
  const candidate = typeof value === "string" ? value : Array.isArray(value) ? (value[0] ?? "") : "";
  return isLocale(candidate) ? candidate : defaultLocale;
}

export default function LocaleError({ reset }: { error: unknown; reset: () => void }) {
  const params = useParams();
  const locale = localeFromParams(params.locale);
  const messages = messagesFor(locale);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold leading-tight text-dark sm:text-4xl">{messages.site.errorMessage}</h1>
      <button
        type="button"
        className={`w-fit rounded-button bg-primary px-4 py-2 text-sm font-bold text-surface ${focusRing}`}
        onClick={() => reset()}
      >
        {messages.site.tryAgain}
      </button>
      <Link href={homePath(locale)} className={`w-fit text-sm font-bold text-primary no-underline ${focusRing}`}>
        {messages.site.name}
      </Link>
    </main>
  );
}
