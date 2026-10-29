import { notFound } from "next/navigation";
import { UploadQueue, type LibraryEntry, type CampaignOfferChoice } from "@/components/upload-queue";
import { isLocale, messagesFor } from "@/i18n/config";
import { readCampaignOfferRows, readLibrary, readSlots } from "@/lib/operator-data";
import { isUploadSlot } from "@/lib/media-object-name";
import { requireOperator } from "@/lib/require-operator";
import { presignView } from "@/lib/r2";

export default async function MediaObjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; slot?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const [rows, slots, records] = await Promise.all([readCampaignOfferRows(gate), readSlots(gate), readLibrary(gate)]);
  const codeKeys = (rows ?? []).map((row) => row.code_key);
  const campaignOffers: CampaignOfferChoice[] = (rows ?? []).map((row) => ({
    code: row.code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
  }));
  const byId = new Map((rows ?? []).map((row) => [row.id, row.code_key.toUpperCase()]));
  const occupied = slots.flatMap((slot) => {
    const code = byId.get(slot.campaignOfferId);
    if (!code) return [];
    return [`${code}:${slot.slot}`];
  });
  const library: LibraryEntry[] = [];
  for (const record of records) {
    let previewUrl = "";
    try {
      previewUrl = await presignView(record.objectKey);
    } catch {
      previewUrl = "";
    }
    library.push({
      campaignOfferId: record.campaignOfferId,
      code: record.code,
      nameAr: record.nameAr,
      nameEn: record.nameEn,
      slot: record.slot,
      previewUrl,
      video: record.video,
    });
  }
  const initialCode = typeof query.code === "string" ? query.code : "";
  const initialSlot = typeof query.slot === "string" && isUploadSlot(query.slot) ? query.slot : "";
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.mediaObjectsHeading}</h1>
      <UploadQueue
        locale={locale}
        codeKeys={codeKeys}
        occupied={occupied}
        campaignOffers={campaignOffers}
        library={library}
        initialCode={initialCode}
        initialSlot={initialSlot}
      />
    </div>
  );
}
