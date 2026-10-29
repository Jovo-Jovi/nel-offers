import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButtons } from "@/components/public/action-buttons";
import { CodeBadge } from "@/components/public/code-badge";
import { ExpiryBox } from "@/components/public/expiry-box";
import { GalleryPreview } from "@/components/public/gallery-preview";
import { MainMediaObject } from "@/components/public/main-media-object";
import { PageShell } from "@/components/public/page-shell";
import { PriceCard } from "@/components/public/price-card";
import { TermsBox } from "@/components/public/terms-box";
import { ThumbnailRow } from "@/components/public/thumbnail-row";
import { LatinRun } from "@/components/latin-run";
import { TokenLine } from "@/components/public/numbered-line";
import {
  campaignOfferPath,
  defaultLocale,
  homePath,
  isLocale,
  messagesFor,
  otherLocale,
  prefixedLocale,
} from "@/i18n/config";
import { dialLink, orderLink } from "@/lib/campaign-links";
import { fillMessage } from "@/lib/fill-message";
import { calendarParts, formatPrice } from "@/lib/format-values";
import { loadCampaignOfferAttachments, loadPublishedCampaign, loadVisibleCampaignOffer } from "@/lib/public-data";
import { publicShareMetadata } from "@/lib/share-metadata";
import { shellProps } from "@/lib/public-shell";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

async function visibleRow(locale: string, code: string) {
  if (!isLocale(locale)) return null;
  return loadVisibleCampaignOffer(code);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  if (!isLocale(locale)) return {};
  const row = await visibleRow(locale, code);
  if (!row) notFound();
  const messages = messagesFor(locale);
  const name = locale === defaultLocale ? row.nameAr : row.nameEn;
  const title = `${name} — ${messages.site.name}`;
  const description = fillMessage(messages.header.campaignOfferSubtitle, { code: row.code });
  return publicShareMetadata(locale, title, description);
}

export default async function CampaignOfferPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: localeParam, code } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const row = await visibleRow(locale, code);
  if (!row) notFound();
  const campaign = await loadPublishedCampaign();
  if (!campaign?.isPublished) notFound();
  const messages = messagesFor(locale);
  const attachments = await loadCampaignOfferAttachments(row.id);
  const clip = attachments.find((entry) => entry.slot === "main_video") ?? null;
  const mainPicture = attachments.find((entry) => entry.slot === "main_image") ?? null;
  const galleries = attachments.filter((entry) => entry.slot.startsWith("gallery"));
  const name = locale === defaultLocale ? row.nameAr : row.nameEn;
  const otherName = locale === defaultLocale ? row.nameEn : row.nameAr;
  const conditions = locale === defaultLocale ? row.conditionsAr : row.conditionsEn;
  const parts = calendarParts(row.endsOn);
  const mainAlt = fillMessage(messages.campaignOffer.galleryAlt, { position: "1", name });
  const thumbs = galleries.map((entry, index) => ({
    url: entry.url,
    label: fillMessage(messages.campaignOffer.imageLabel, { position: String(index + 1) }),
    previewIndex: (mainPicture ? 1 : 0) + index,
    active: index === 0,
  }));
  const pictures = [
    ...(mainPicture ? [{ url: mainPicture.url, label: mainAlt }] : []),
    ...thumbs.map((thumb) => ({ url: thumb.url, label: thumb.label })),
  ];
  const orderMessage = fillMessage(messages.campaignOffer.orderMessage, { code: row.code, name });
  return (
    <PageShell
      {...shellProps(
        locale,
        campaign,
        <TokenLine
          template={messages.header.campaignOfferSubtitle}
          token="code"
          value={<LatinRun>{row.code}</LatinRun>}
        />,
        campaignOfferPath(otherLocale(locale), row.code),
      )}
      dockActions
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:gap-10">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Link
              href={homePath(locale)}
              className={`w-fit text-sm font-bold text-primary no-underline ${focusRing}`}
            >
              <span className="inline-block public-mirror-ltr" aria-hidden="true">
                →
              </span>{" "}
              {messages.nav.allCampaignOffers}
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 text-start">
                <h1 className="text-3xl font-bold leading-tight text-dark sm:text-4xl">{name}</h1>
                {locale === defaultLocale ? (
                  <p className="mt-2 text-end text-sm text-muted">
                    <LatinRun>
                      <span lang={prefixedLocale}>{otherName}</span>
                    </LatinRun>
                  </p>
                ) : (
                  <p lang={defaultLocale} className="mt-2 text-end text-sm text-muted">
                    <bdi>{otherName}</bdi>
                  </p>
                )}
              </div>
              <CodeBadge label={messages.campaignOffer.codeLabel} code={row.code} />
            </div>
          </div>
          <GalleryPreview
            pictures={pictures}
            locale={locale}
            previousLabel={messages.a11y.previousImage}
            nextLabel={messages.a11y.nextImage}
            closeLabel={messages.a11y.closePreview}
          >
            <div
              className={
                thumbs.length > 0
                  ? "grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem] md:items-stretch"
                  : ""
              }
            >
              <MainMediaObject
                clipUrl={clip ? (mainPicture ? clip.url : `${clip.url}#t=0.1`) : null}
                pictureUrl={mainPicture?.url ?? null}
                pictureAlt={mainAlt}
                playLabel={messages.a11y.playVideo}
                previewIndex={mainPicture && !clip ? 0 : null}
              />
              {thumbs.length > 0 ? <ThumbnailRow thumbs={thumbs} /> : null}
            </div>
          </GalleryPreview>
        </section>
        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex flex-col gap-6 p-5 sm:p-6">
              <PriceCard
                label={messages.campaignOffer.priceLabel}
                value={formatPrice(locale, row.priceText)}
                currency={messages.campaignOffer.currency}
              />
              <ExpiryBox
                label={messages.campaignOffer.endsOnLabel}
                day={parts?.day ?? ""}
                month={parts?.month ?? ""}
                year={parts?.year ?? ""}
                dayLabel={messages.campaignOffer.day}
                monthLabel={messages.campaignOffer.month}
                yearLabel={messages.campaignOffer.year}
              />
              {conditions ? <TermsBox heading={messages.campaignOffer.conditionsHeading} body={conditions} /> : null}
              <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:border-t max-lg:border-border max-lg:bg-surface max-lg:px-4 max-lg:py-3 max-lg:shadow-card">
                <ActionButtons
                  callHref={dialLink(campaign?.hotlineDial ?? "")}
                  callLabel={messages.actions.callShort}
                  orderHref={orderLink(campaign?.whatsappDigits ?? "", orderMessage)}
                  orderLabel={messages.actions.whatsapp}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
