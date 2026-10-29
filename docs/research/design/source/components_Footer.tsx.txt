import { hotlineHref, hotlineNumber, whatsappHref, whatsappNumber } from "@/data/contact";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type FooterProps = {
  pageNumber: number;
};

const focusRing =
  "rounded-button focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Footer({ pageNumber }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm font-bold">
          <a href={hotlineHref} className={`text-dark no-underline ${focusRing}`}>
            الخط الساخن {hotlineNumber}
          </a>
          <span className="mx-2 font-normal text-muted" aria-hidden="true">
            |
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-whatsapp no-underline ${focusRing}`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            واتساب {whatsappNumber}
          </a>
        </p>
        <p className="text-sm text-muted">صفحة {pageNumber} ـــ قالب قابل للتعديل</p>
      </div>
    </footer>
  );
}
