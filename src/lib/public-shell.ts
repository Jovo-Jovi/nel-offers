import type { ReactNode } from "react";
import { chatLink, dialLink } from "@/lib/campaign-links";
import type { PublishedCampaign } from "@/lib/public-data";
import { homePath, messagesFor, type Locale } from "@/i18n/config";

export function shellProps(
  locale: Locale,
  campaign: PublishedCampaign | null,
  subtitle: ReactNode,
  switchHref: string,
) {
  const messages = messagesFor(locale);
  return {
    subtitle,
    homeHref: homePath(locale),
    siteName: messages.site.name,
    markAlt: messages.a11y.mark,
    labSite:
      campaign && campaign.nelSiteUrl.length > 0
        ? { href: campaign.nelSiteUrl, label: messages.header.labSite }
        : null,
    hotline:
      campaign && campaign.hotlineDial.length > 0
        ? { href: dialLink(campaign.hotlineDial), template: messages.footer.hotline, number: campaign.hotlineDisplay }
        : null,
    whatsapp:
      campaign && campaign.whatsappDigits.length > 0
        ? {
            href: chatLink(campaign.whatsappDigits),
            template: messages.footer.whatsapp,
            number: campaign.whatsappDisplay,
          }
        : null,
    switchHref,
    switchLabel: messages.nav.switchLocale,
  };
}
