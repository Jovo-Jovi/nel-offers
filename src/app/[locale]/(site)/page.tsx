import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { CampaignOfferGrid } from "@/components/public/campaign-offer-grid";
import { NumberedLine } from "@/components/public/numbered-line";
import { PageShell } from "@/components/public/page-shell";
import { SearchField } from "@/components/public/search-field";
import { WhatsAppIcon } from "@/components/public/whatsapp-icon";
import type { Catalogue } from "@/i18n/ar";
import { campaignOfferPath, defaultLocale, homePath, isLocale, messagesFor, otherLocale } from "@/i18n/config";
import { chatLink, dialLink } from "@/lib/campaign-links";
import { formatPrice } from "@/lib/format-values";
import { normaliseSearch } from "@/lib/search-normalise";
import { loadPublishedCampaign, loadVisibleCampaignOffers, type PublishedCampaign } from "@/lib/public-data";
import { shellProps } from "@/lib/public-shell";
import { pad2 } from "@/lib/sheet-format";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function HomeHero({ messages, campaign }: { messages: Catalogue; campaign: PublishedCampaign | null }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div
        className={`grid items-center overflow-hidden rounded-card bg-surface shadow-card ${
          campaign?.bannerUrl ? "lg:grid-cols-2" : ""
        }`}
      >
        {campaign?.bannerUrl ? (
          // CSP has no style-src, and next/image writes an inline style.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.bannerUrl}
            alt={messages.a11y.banner}
            className="h-64 w-full object-contain sm:h-80 lg:h-full lg:min-h-[28rem]"
          />
        ) : null}
        <div className="flex flex-col justify-center gap-5 px-5 py-8 text-start sm:px-8 sm:py-10 lg:px-10">
          {campaign ? (
            <>
              <p className="text-sm font-bold text-primary">{messages.home.eyebrow}</p>
              <h1 className="text-4xl font-bold leading-tight text-dark lg:text-5xl">
                {messages.home.heading}
                <span className="mt-2 block text-primary">{messages.site.name}</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">{messages.home.intro}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={dialLink(campaign.hotlineDial)}
                  className={`inline-flex items-center gap-2 rounded-button bg-dark px-4 py-3 text-sm font-bold text-surface no-underline ${focusRing}`}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  <NumberedLine template={messages.footer.hotline} number={campaign.hotlineDisplay} />
                </a>
                <a
                  href={chatLink(campaign.whatsappDigits)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-button bg-whatsapp px-4 py-3 text-sm font-bold text-dark no-underline ${focusRing}`}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {messages.actions.whatsapp}
                </a>
              </div>
            </>
          ) : (
            <h1 className="text-4xl font-bold leading-tight text-dark lg:text-5xl">{messages.home.comingSoon}</h1>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const messages = messagesFor(locale);
  const campaign = await loadPublishedCampaign();
  const rows = campaign ? await loadVisibleCampaignOffers() : [];
  const cards = rows.map((row, index) => ({
    code: row.code,
    href: campaignOfferPath(locale, row.code),
    position: pad2(index + 1),
    name: locale === defaultLocale ? row.nameAr : row.nameEn,
    normalAr: normaliseSearch(row.nameAr),
    normalEn: normaliseSearch(row.nameEn),
    price: campaign?.showCardPrice ? formatPrice(locale, row.priceText) : null,
    currency: messages.campaignOffer.currency,
  }));
  return (
    <PageShell
      {...shellProps(locale, campaign, messages.header.homeSubtitle, homePath(otherLocale(locale)))}
      hero={<HomeHero messages={messages} campaign={campaign} />}
    >
      {campaign ? (
        <section
          data-campaign-offer-panel
          className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6 lg:p-8"
        >
          {rows.length === 0 ? (
            <p className="text-base text-dark">{messages.home.nothingVisible}</p>
          ) : (
            <>
              <SearchField placeholder={messages.home.searchPlaceholder} noMatches={messages.home.noMatches} />
              <CampaignOfferGrid cards={cards} />
            </>
          )}
        </section>
      ) : null}
    </PageShell>
  );
}
