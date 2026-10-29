"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { messagesFor, operatorPath, type Locale, type OperatorSegment } from "@/i18n/config";
import { focusRing } from "@/components/operator-classes";

const links = ["overview", "campaign-offers", "import", "media-objects", "campaign-settings"] as const;

export function DashboardNav({ locale, current }: { locale: Locale; current: OperatorSegment }) {
  const messages = messagesFor(locale);
  const [open, setOpen] = useState(false);
  const labels: Record<(typeof links)[number], string> = {
    overview: messages.nav.overview,
    "campaign-offers": messages.nav.campaignOffers,
    import: messages.nav.importSheet,
    "media-objects": messages.nav.mediaObjects,
    "campaign-settings": messages.nav.campaignSettings,
  };
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-button border border-border px-3 py-2 text-sm md:hidden ${focusRing}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
        {open ? messages.nav.closeMenu : messages.nav.openMenu}
      </button>
      <nav className={`${open ? "flex" : "hidden"} min-w-0 flex-wrap gap-2 md:flex`}>
        {links.map((segment) => {
          const active = segment === current;
          return (
            <a
              key={segment}
              href={operatorPath(locale, segment)}
              aria-current={active ? "page" : undefined}
              className={`rounded-button px-3 py-2 text-sm ${focusRing} ${active ? "bg-primary text-surface" : "text-dark"}`}
            >
              {labels[segment]}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
