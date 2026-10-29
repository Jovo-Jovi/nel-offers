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
  const labels: Record<(typeof links)[number]["segment"], { full: string; short: string }> = {
    overview: { full: messages.nav.overview, short: messages.nav.overviewShort },
    "campaign-offers": { full: messages.nav.campaignOffers, short: messages.nav.campaignOffersShort },
    import: { full: messages.nav.importSheet, short: messages.nav.importShort },
    "media-objects": { full: messages.nav.mediaObjects, short: messages.nav.mediaObjectsShort },
    "campaign-settings": { full: messages.nav.campaignSettings, short: messages.nav.campaignSettingsShort },
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
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2 text-center text-[10px] leading-tight lg:flex-none lg:flex-row lg:justify-start lg:rounded-button lg:px-3 lg:py-2 lg:text-start lg:text-sm ${focusRing} ${
              active ? "text-primary lg:bg-primary lg:text-surface" : "text-dark"
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span data-nav-short className="block w-full min-w-0 break-words lg:hidden">
              {labels[segment].short}
            </span>
            <span className="hidden w-full truncate lg:inline">{labels[segment].full}</span>
          </a>
        );
      })}
    </nav>
  );
}
