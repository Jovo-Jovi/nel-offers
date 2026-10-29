import { notFound } from "next/navigation";
import { UploadQueue } from "@/components/upload-queue";
import { isLocale, messagesFor } from "@/i18n/config";
import { readCampaignOfferRows, readSlots } from "@/lib/operator-data";
import { requireOperator } from "@/lib/require-operator";

export default async function MediaObjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const [rows, slots] = await Promise.all([readCampaignOfferRows(gate), readSlots(gate)]);
  const codeKeys = (rows ?? []).map((row) => row.code_key);
  const byId = new Map((rows ?? []).map((row) => [row.id, row.code_key.toUpperCase()]));
  const occupied = slots.flatMap((slot) => {
    const code = byId.get(slot.campaignOfferId);
    if (!code) return [];
    return [`${code}:${slot.slot}`];
  });
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.mediaObjectsHeading}</h1>
      <UploadQueue locale={locale} codeKeys={codeKeys} occupied={occupied} />
    </div>
  );
}
