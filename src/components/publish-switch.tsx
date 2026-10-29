"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPublished } from "@/app/[locale]/operator/(dashboard)/actions";
import { SlideSwitch } from "@/components/slide-switch";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { messagesFor, type Locale } from "@/i18n/config";
import { fillMessage } from "@/lib/fill-message";

export function PublishSwitch({
  locale,
  published,
  campaignOfferCount,
  contactsReady,
}: {
  locale: Locale;
  published: boolean;
  campaignOfferCount: number;
  contactsReady: boolean;
}) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const router = useRouter();
  const [on, setOn] = useState(published);
  const [busy, setBusy] = useState(false);
  const blocked = campaignOfferCount === 0 || !contactsReady;
  const reason =
    campaignOfferCount === 0
      ? messages.operator.publishNeedCampaignOffers
      : !contactsReady
        ? messages.operator.publishNeedContacts
        : "";

  async function toggle() {
    if (busy || blocked) return;
    const next = !on;
    const body = next
      ? fillMessage(messages.operator.publishOnConfirm, { count: campaignOfferCount })
      : messages.operator.publishOffConfirm;
    const accepted = await confirm(messages.operator.publishLabel, body);
    if (!accepted) return;
    setBusy(true);
    const outcome = await setPublished(locale, next);
    setBusy(false);
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    setOn(next);
    toast(messages.operator.saved, "status");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SlideSwitch
        large
        checked={on}
        disabled={blocked || busy}
        label={messages.operator.publishLabel}
        onToggle={() => void toggle()}
      />
      <span className="text-sm">{messages.operator.publishLabel}</span>
      {reason ? <span className="text-sm text-muted">{reason}</span> : null}
    </div>
  );
}
