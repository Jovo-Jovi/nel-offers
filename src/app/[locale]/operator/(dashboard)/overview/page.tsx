import { notFound } from "next/navigation";
import { PublishSwitch } from "@/components/publish-switch";
import { LatinRun } from "@/components/latin-run";
import { cardClass } from "@/components/operator-classes";
import { isLocale, messagesFor, operatorPath, type Locale } from "@/i18n/config";
import { contactsComplete } from "@/lib/campaign-contacts";
import { formatCount, formatStamp } from "@/lib/format-values";
import { fillMessage } from "@/lib/fill-message";
import { contactDraft, readCampaign, readLastImport, readCampaignOfferRows, readStatuses } from "@/lib/operator-data";
import { requireOperator } from "@/lib/require-operator";

export default async function OverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await requireOperator(locale);
  const messages = messagesFor(locale);
  const [campaign, rows, statuses, lastImport] = await Promise.all([
    readCampaign(gate),
    readCampaignOfferRows(gate),
    readStatuses(gate),
    readLastImport(gate),
  ]);
  const draft = campaign
    ? contactDraft(campaign)
    : {
        whatsapp_display: "",
        whatsapp_digits: "",
        hotline_display: "",
        hotline_dial: "",
        nel_site_url: "",
      };
  const ready = contactsComplete(draft);
  const campaignOfferCount = rows?.length ?? 0;
  const published = campaign?.is_published === true;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.overviewHeading}</h1>
      <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Count locale={locale} status="visible" label={messages.operator.statusVisible} value={statuses.counts.visible} />
        <Count locale={locale} status="scheduled" label={messages.operator.statusScheduled} value={statuses.counts.scheduled} />
        <Count locale={locale} status="ended" label={messages.operator.statusEnded} value={statuses.counts.ended} />
        <Count locale={locale} status="hidden" label={messages.operator.statusHidden} value={statuses.counts.hidden} />
      </ul>
      <section className={cardClass}>
        <p>{ready ? messages.operator.contactsComplete : messages.operator.contactsMissing}</p>
        <a className="mt-2 inline-block text-sm text-primary" href={operatorPath(locale, "campaign-settings")}>
          {messages.operator.openSettings}
        </a>
      </section>
      <section className={cardClass}>
        <h2 className="text-lg">{messages.operator.lastImport}</h2>
        {lastImport ? (
          <>
            <p>{fillMessage(messages.operator.importWhen, { when: formatStamp(locale, lastImport.confirmedAt) })}</p>
            <p>{fillMessage(messages.operator.importAdded, { count: lastImport.added })}</p>
            <p>{fillMessage(messages.operator.importUpdated, { count: lastImport.updated })}</p>
            <p>{fillMessage(messages.operator.importUnchanged, { count: lastImport.unchanged })}</p>
          </>
        ) : (
          <p>{messages.operator.noImport}</p>
        )}
      </section>
      <PublishSwitch locale={locale} published={published} campaignOfferCount={campaignOfferCount} contactsReady={ready} />
    </div>
  );
}

function Count({
  locale,
  status,
  label,
  value,
}: {
  locale: Locale;
  status: string;
  label: string;
  value: number;
}) {
  return (
    <li className={cardClass} data-status={status}>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl">
        <LatinRun>{formatCount(locale, value)}</LatinRun>
      </p>
    </li>
  );
}
