"use client";

import { Clapperboard, LayoutDashboard, Settings, Table, Tags } from "lucide-react";
import { messagesFor, operatorPath, type Locale, type OperatorSegment } from "@/i18n/config";
import { focusRing } from "@/components/operator-classes";

const links = [
  { segment: "overview", icon: LayoutDashboard },
  { segment: "campaign-offers", icon: Tags },
  { segment: "import", icon: Table },
  { segment: "media-objects", icon: Clapperboard },
  { segment: "campaign-settings", icon: Settings },
] as const;

export function DashboardNav({ locale, current }: { locale: Locale; current: OperatorSegment }) {
  const messages = messagesFor(locale);
  const labels: Record<(typeof links)[number]["segment"], string> = {
    overview: messages.nav.overview,
    "campaign-offers": messages.nav.campaignOffers,
    import: messages.nav.importSheet,
    "media-objects": messages.nav.mediaObjects,
    "campaign-settings": messages.nav.campaignSettings,
  };
  return (
    <nav
      aria-label={messages.nav.dashboard}
      className="fixed inset-x-0 bottom-0 z-30 flex min-w-0 border-t border-border bg-surface lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-e lg:border-t-0 lg:bg-transparent lg:px-3 lg:py-4"
    >
      {links.map(({ segment, icon: Icon }) => {
        const active = segment === current;
        return (
          <a
            key={segment}
            href={operatorPath(locale, segment)}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-center text-xs lg:flex-none lg:flex-row lg:justify-start lg:rounded-button lg:px-3 lg:py-2 lg:text-start lg:text-sm ${focusRing} ${
              active ? "text-primary lg:bg-primary lg:text-surface" : "text-dark"
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="w-full truncate">{labels[segment]}</span>
          </a>
        );
      })}
    </nav>
  );
}
