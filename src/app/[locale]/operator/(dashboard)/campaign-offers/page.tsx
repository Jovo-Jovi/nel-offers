import { notFound } from "next/navigation";
import { CampaignOfferList, type CampaignOfferView, type SlotPicture } from "@/components/campaign-offer-list";
import { isLocale, messagesFor } from "@/i18n/config";
import { formatCalendar, formatPrice } from "@/lib/format-values";
import { readCampaignOfferRows, readLibrary, readStatuses } from "@/lib/operator-data";
import { requireOperator } from "@/lib/require-operator";
import { presignView } from "@/lib/r2";

export default async function CampaignOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; gap?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const [rows, statuses, records] = await Promise.all([
    readCampaignOfferRows(gate),
    readStatuses(gate),
    readLibrary(gate),
  ]);
  const bySlot = new Map<string, SlotPicture>();
  for (const record of records) {
    let previewUrl = "";
    try {
      previewUrl = await presignView(record.objectKey);
    } catch {
      previewUrl = "";
    }
    bySlot.set(`${record.campaignOfferId}:${record.slot}`, {
      slot: record.slot,
      previewUrl,
      video: record.video,
    });
  }
  const views: CampaignOfferView[] = (rows ?? []).map((row) => {
    const pictures = [...bySlot.entries()]
      .filter(([key]) => key.startsWith(`${row.id}:`))
      .map(([, picture]) => picture);
    return {
      id: row.id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      price: formatPrice(locale, row.price_egp),
      start: row.starts_on ? formatCalendar(locale, row.starts_on) : "",
      end: formatCalendar(locale, row.ends_on),
      status: statuses.byId.get(row.id) ?? "",
      pictures,
    };
  });
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.campaignOffersHeading}</h1>
      <p className="text-sm text-muted">{messages.operator.readOnlyLine}</p>
      <CampaignOfferList
        locale={locale}
        rows={views}
        initialStatus={typeof query.status === "string" ? query.status : ""}
        initialGap={typeof query.gap === "string" ? query.gap : ""}
      />
    </div>
  );
}
