import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampaignOfferCard } from "@/components/public/campaign-offer-card";
import { campaignOfferPath, defaultLocale, localeCodes, messagesFor, type Locale } from "@/i18n/config";

function syntheticName(locale: Locale) {
  if (locale === defaultLocale) return "تحليل تجريبي";
  return "Synthetic analysis";
}

describe("campaign offer card", () => {
  for (const locale of localeCodes) {
    it(`shows the action and hides the code in ${locale}`, () => {
      const messages = messagesFor(locale);
      const name = syntheticName(locale);
      const markup = renderToStaticMarkup(
        createElement(CampaignOfferCard, {
          href: campaignOfferPath(locale, "SYN-001"),
          position: "01",
          name,
          price: null,
          currency: messages.campaignOffer.currency,
          action: messages.home.cardAction,
        }),
      );
      const text = markup.replace(/<[^>]+>/g, "");
      expect(text).toContain(name);
      expect(text).toContain(messages.home.cardAction);
      expect(text).not.toContain("SYN-001");
      expect(markup.match(/<a\b/g)).toHaveLength(1);
      expect(markup).toContain('aria-hidden="true"');
    });
  }
});
