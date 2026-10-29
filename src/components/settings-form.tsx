"use client";

import { useState } from "react";
import { LoaderCircle as Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveContacts, setCardPrice } from "@/app/[locale]/operator/(dashboard)/actions";
import { fieldClass } from "@/components/operator-classes";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { SlideSwitch } from "@/components/slide-switch";
import { BusyButton } from "@/components/submit-button";
import { messagesFor, type Locale } from "@/i18n/config";
import { contactProblems, type ContactDraft, type ContactField, type ContactProblem } from "@/lib/campaign-contacts";
import { fillMessage } from "@/lib/fill-message";
import { displayTextLimit, siteUrlLimit } from "@/lib/sheet-format";

const fields: { key: ContactField; label: "whatsappDisplay" | "whatsappDigits" | "hotlineDisplay" | "hotlineDial" | "nelSiteUrl" }[] = [
  { key: "whatsapp_display", label: "whatsappDisplay" },
  { key: "whatsapp_digits", label: "whatsappDigits" },
  { key: "hotline_display", label: "hotlineDisplay" },
  { key: "hotline_dial", label: "hotlineDial" },
  { key: "nel_site_url", label: "nelSiteUrl" },
];

function problemText(locale: Locale, field: ContactField, problem: ContactProblem) {
  const messages = messagesFor(locale);
  if (problem === "required") return messages.operator.fieldRequired;
  if (problem === "pattern") return messages.operator.fieldPattern;
  const limit = field === "nel_site_url" ? siteUrlLimit : displayTextLimit;
  return fillMessage(messages.operator.fieldTooLong, { limit });
}

export function SettingsForm({ locale, saved }: { locale: Locale; saved: ContactDraft }) {
  const messages = messagesFor(locale);
  const { toast } = useOperatorFeedback();
  const router = useRouter();
  const [draft, setDraft] = useState(saved);
  const [problems, setProblems] = useState<Partial<Record<ContactField, ContactProblem>>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    const local = contactProblems(draft);
    setProblems(local);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    const outcome = await saveContacts(locale, draft);
    setBusy(false);
    if (!outcome.ok) {
      if ("problems" in outcome && outcome.problems) setProblems(outcome.problems);
      else toast(messages.operator.rejected, "alert");
      return;
    }
    toast(messages.operator.saved, "status");
    router.refresh();
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {fields.map((field) => {
        const problem = problems[field.key];
        const described = problem ? `${field.key}-error` : undefined;
        return (
          <label key={field.key} className="flex min-w-0 flex-col gap-1 text-sm">
            {messages.operator[field.label]}
            <input
              className={fieldClass}
              name={field.key}
              value={draft[field.key]}
              aria-invalid={problem ? true : undefined}
              aria-describedby={described}
              onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
            />
            {problem ? (
              <span id={`${field.key}-error`} className="text-error">
                {problemText(locale, field.key, problem)}
              </span>
            ) : null}
          </label>
        );
      })}
      <BusyButton busy={busy} type="submit" label={messages.operator.saveContacts} pendingLabel={messages.operator.pending} />
    </form>
  );
}

export function CardPriceSwitch({ locale, showCardPrice }: { locale: Locale; showCardPrice: boolean }) {
  const messages = messagesFor(locale);
  const { toast } = useOperatorFeedback();
  const router = useRouter();
  const [on, setOn] = useState(showCardPrice);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setBusy(true);
    const outcome = await setCardPrice(locale, next);
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
      {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      <SlideSwitch checked={on} disabled={busy} label={messages.operator.showCardPrice} onToggle={() => void toggle()} />
      <span className="text-sm">{messages.operator.showCardPrice}</span>
    </div>
  );
}
