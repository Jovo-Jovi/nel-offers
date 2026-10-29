import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/public/whatsapp-icon";

type ActionButtonsProps = {
  callHref: string;
  callLabel: string;
  orderHref: string;
  orderLabel: string;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ActionButtons({ callHref, callLabel, orderHref, orderLabel }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2" data-actions>
      <a
        href={callHref}
        className={`inline-flex items-center justify-center gap-2 rounded-button bg-dark px-3 py-3 text-sm font-bold text-surface no-underline transition hover:opacity-90 ${focusRing}`}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {callLabel}
      </a>
      <a
        href={orderHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-button bg-whatsapp px-3 py-3 text-sm font-bold text-dark no-underline transition hover:opacity-90 ${focusRing}`}
      >
        <WhatsAppIcon className="h-4 w-4" />
        {orderLabel}
      </a>
    </div>
  );
}
