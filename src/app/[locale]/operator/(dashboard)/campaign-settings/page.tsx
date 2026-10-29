import { notFound } from "next/navigation";
import { BannerPanel } from "@/components/banner-panel";
import { LatinRun } from "@/components/latin-run";
import { CardPriceSwitch, SettingsForm } from "@/components/settings-form";
import { isLocale, messagesFor } from "@/i18n/config";
import { contactsComplete, type ContactDraft } from "@/lib/campaign-contacts";
import { contactDraft, readBannerKey, readCampaign } from "@/lib/operator-data";
import { requireOperator } from "@/lib/require-operator";
import { presignView } from "@/lib/r2";

const emptyDraft: ContactDraft = {
  whatsapp_display: "",
  whatsapp_digits: "",
  hotline_display: "",
  hotline_dial: "",
  nel_site_url: "",
};

export default async function CampaignSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const campaign = await readCampaign(gate);
  const draft = campaign ? contactDraft(campaign) : emptyDraft;
  const bannerId =
    campaign && typeof campaign.banner_media_object_id === "string" ? campaign.banner_media_object_id : null;
  const bannerKey = await readBannerKey(gate, bannerId);
  let bannerUrl = "";
  if (bannerKey) {
    try {
      bannerUrl = await presignView(bannerKey);
    } catch {
      bannerUrl = "";
    }
  }
  const ready = contactsComplete(draft);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <h1 className="text-2xl">{messages.operator.settingsHeading}</h1>
      <SettingsForm locale={locale} saved={draft} />
      {ready ? (
        <ul className="flex min-w-0 flex-col gap-2 text-sm">
          <li>
            <a href={`https://wa.me/${draft.whatsapp_digits}`}>{messages.operator.linkWhatsapp}</a>
          </li>
          <li>
            <a href={`tel:${draft.hotline_dial}`}>{messages.operator.linkCall}</a>
          </li>
          <li>
            <a href={draft.nel_site_url}>
              {messages.operator.linkNel} <LatinRun>{draft.nel_site_url}</LatinRun>
            </a>
          </li>
        </ul>
      ) : null}
      <CardPriceSwitch locale={locale} showCardPrice={campaign?.show_card_price === true} />
      <BannerPanel locale={locale} bannerKey={bannerKey ?? ""} bannerUrl={bannerUrl} />
    </div>
  );
}
