import { NumberedLine } from "@/components/public/numbered-line";
import { WhatsAppIcon } from "@/components/public/whatsapp-icon";

type ContactLink = {
  href: string;
  template: string;
  number: string;
};

type FooterProps = {
  hotline: ContactLink | null;
  whatsapp: ContactLink | null;
  switchHref: string;
  switchLabel: string;
};

const focusRing =
  "rounded-button focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Footer({ hotline, whatsapp, switchHref, switchLabel }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {hotline && whatsapp ? (
          <p className="text-sm font-bold">
            <a href={hotline.href} className={`text-dark no-underline ${focusRing}`}>
              <NumberedLine template={hotline.template} number={hotline.number} />
            </a>
            <span className="mx-2 font-normal text-muted" aria-hidden="true">
              |
            </span>
            <a
              href={whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-whatsapp no-underline ${focusRing}`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              <NumberedLine template={whatsapp.template} number={whatsapp.number} />
            </a>
          </p>
        ) : null}
        <a href={switchHref} className={`text-sm text-muted no-underline ${focusRing}`}>
          {switchLabel}
        </a>
      </div>
    </footer>
  );
}
