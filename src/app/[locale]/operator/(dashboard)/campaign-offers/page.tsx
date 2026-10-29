import { notFound } from "next/navigation";
import { CampaignOfferList, type CampaignOfferView } from "@/components/campaign-offer-list";
import { isLocale, messagesFor } from "@/i18n/config";
import { formatCalendar, formatPrice } from "@/lib/format-values";
import { readCampaignOfferRows, readSlots, readStatuses } from "@/lib/operator-data";
import { requireOperator } from "@/lib/require-operator";

export default async function CampaignOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const [rows, statuses, slots] = await Promise.all([
    readCampaignOfferRows(gate),
    readStatuses(gate),
    readSlots(gate),
  ]);
  const views: CampaignOfferView[] = (rows ?? []).map((row) => {
    const filled = slots
      .filter((slot) => slot.campaignOfferId === row.id)
      .map((slot) => slot.slot);
    return {
      id: row.id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      price: formatPrice(locale, row.price_egp),
      start: row.starts_on ? formatCalendar(locale, row.starts_on) : messages.operator.noStart,
      end: formatCalendar(locale, row.ends_on),
      status: statuses.byId.get(row.id) ?? "",
      filled,
    };
  });
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.campaignOffersHeading}</h1>
      <CampaignOfferList locale={locale} rows={views} />
    </div>
  );
}
