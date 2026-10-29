import { Phone } from "lucide-react";
import { hotlineHref, whatsappHref } from "@/data/contact";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ActionButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
        <a
          href={hotlineHref}
          className={`inline-flex items-center justify-center gap-2 rounded-button bg-dark px-3 py-3 text-sm font-bold text-surface no-underline transition hover:opacity-90 ${focusRing}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          اتصل
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 rounded-button bg-whatsapp px-3 py-3 text-sm font-bold text-dark no-underline transition hover:opacity-90 ${focusRing}`}
        >
          <WhatsAppIcon className="h-4 w-4" />
          واتساب
        </a>
    </div>
  );
}
