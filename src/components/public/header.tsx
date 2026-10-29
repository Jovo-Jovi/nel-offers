import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type HeaderProps = {
  subtitle: ReactNode;
  homeHref: string;
  siteName: string;
  markAlt: string;
  labSite: { href: string; label: string } | null;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Header({ subtitle, homeHref, siteName, markAlt, labSite }: HeaderProps) {
  return (
    <header className="sticky top-3 z-30 mx-auto mt-3 mb-4 flex w-full max-w-7xl items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card md:top-6 md:mt-6 md:mb-6 md:gap-3 md:px-4">
      <Link
        href={homeHref}
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-button bg-surface ${focusRing}`}
      >
        {/* CSP has no style-src, and next/image writes an inline style. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark/nel-mark.png" alt={markAlt} className="h-full w-full object-contain" />
      </Link>
      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-base font-bold leading-tight sm:text-lg">
          <Link href={homeHref} className={`rounded-button no-underline ${focusRing}`}>
            {siteName}
          </Link>
        </p>
        <p className="mt-0.5 hidden truncate text-xs text-muted sm:block sm:text-sm">{subtitle}</p>
      </div>
      {labSite ? (
        <a
          href={labSite.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-11 shrink-0 items-center gap-1 rounded-button bg-primary px-2 text-xs font-bold text-surface no-underline sm:gap-2 sm:px-4 sm:text-sm ${focusRing}`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {labSite.label}
        </a>
      ) : null}
    </header>
  );
}
