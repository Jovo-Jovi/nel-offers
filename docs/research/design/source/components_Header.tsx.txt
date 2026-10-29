import Link from "next/link";
import { ExternalLink } from "lucide-react";

type HeaderProps = {
  subtitle: string;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const officialSite = "https://www.nileegyptlabs.com/";

export function Header({ subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Replace the logo text with <img src="/logo.png" alt="" className="h-full w-full object-cover" /> */}
        <Link
          href="/"
          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-button bg-primary px-1 text-center text-xs font-bold leading-tight text-surface no-underline ${focusRing}`}
        >
          شعار
          <br />
          المعمل
        </Link>
        <div className="min-w-0 flex-1 text-start">
          <p className="truncate text-base font-bold leading-tight sm:text-lg">
            <Link href="/" className={`rounded-button no-underline ${focusRing}`}>
              معامل النيل مصر
            </Link>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{subtitle}</p>
        </div>
        <a
          href={officialSite}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-button bg-primary px-4 text-sm font-bold text-surface no-underline ${focusRing}`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          موقع المعمل
        </a>
      </div>
    </header>
  );
}
