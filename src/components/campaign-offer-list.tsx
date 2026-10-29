"use client";

import { Clapperboard, Image as ImageIcon, Images } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeCampaignOffer, removeCampaignOfferMedia, setCampaignOfferShown } from "@/app/[locale]/operator/(dashboard)/actions";
import { LatinRun } from "@/components/latin-run";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { BusyButton } from "@/components/submit-button";
import { SlideSwitch } from "@/components/slide-switch";
import { cardClass, fieldClass } from "@/components/operator-classes";
import { messagesFor, operatorPath, type Locale } from "@/i18n/config";
import { fillMessage } from "@/lib/fill-message";
import { slotText } from "@/lib/operator-copy";

const slotOrder = ["main_video", "main_image", "gallery_1", "gallery_2", "gallery_3"] as const;
const statusFilters = ["all", "visible", "scheduled", "ended", "off", "hidden"] as const;

export type CampaignOfferView = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  price: string;
  start: string;
  end: string;
  status: string;
  filled: string[];
};

function statusLabel(locale: Locale, status: string) {
  const messages = messagesFor(locale);
  if (status === "visible") return messages.operator.statusVisible;
  if (status === "scheduled") return messages.operator.statusScheduled;
  if (status === "ended") return messages.operator.statusEnded;
  if (status === "hidden") return messages.operator.statusHidden;
  if (status === "off") return messages.operator.statusOff;
  return status;
}

function filterLabel(locale: Locale, status: (typeof statusFilters)[number]) {
  if (status === "all") return messagesFor(locale).operator.filterAll;
  return statusLabel(locale, status);
}

function SlotMark({ slot }: { slot: string }) {
  if (slot === "main_video") return <Clapperboard className="size-4" aria-hidden="true" />;
  if (slot.startsWith("gallery")) return <Images className="size-4" aria-hidden="true" />;
  return <ImageIcon className="size-4" aria-hidden="true" />;
}

export function CampaignOfferList({
  locale,
  rows,
  initialStatus,
  initialGap,
}: {
  locale: Locale;
  rows: CampaignOfferView[];
  initialStatus: string;
  initialGap: string;
}) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(statusFilters.includes(initialStatus as (typeof statusFilters)[number]) ? initialStatus : "all");
  const [gap, setGap] = useState(initialGap === "media");
  const [menu, setMenu] = useState("");
  const [pending, setPending] = useState("");
  const [hiding, setHiding] = useState("");
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [filledById, setFilledById] = useState<Record<string, string[]>>({});
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const visible = rows
    .filter((row) => !removedIds.includes(row.id))
    .map((row) => ({
      ...row,
      status: statusById[row.id] ?? row.status,
      filled: filledById[row.id] ?? row.filled,
    }));

  const needle = query.trim().toLowerCase();
  const shown = visible.filter((row) => {
    if (gap && (row.filled.includes("main_video") || row.filled.includes("main_image"))) return false;
    if (status !== "all" && row.status !== status) return false;
    if (!needle) return true;
    return (
      row.code.toLowerCase().includes(needle) ||
      row.nameAr.toLowerCase().includes(needle) ||
      row.nameEn.toLowerCase().includes(needle)
    );
  });

  async function toggleShown(row: CampaignOfferView) {
    if (pending) return;
    const next = row.status === "off";
    setPending(row.id);
    const outcome = await setCampaignOfferShown(locale, row.id, next);
    setPending("");
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    setStatusById((current) => ({ ...current, [row.id]: next ? "visible" : "off" }));
    toast(messages.operator.saved, "status");
    router.refresh();
  }

  async function removeSlot(row: CampaignOfferView, slot: string) {
    if (pending) return;
    const accepted = await confirm(
      messages.operator.remove,
      fillMessage(messages.operator.slotRemoveConfirm, { code: row.code, slot: slotText(messages, slot) }),
    );
    if (!accepted) return;
    setPending(`${row.id}:${slot}`);
    const outcome = await removeCampaignOfferMedia(locale, row.id, slot);
    setPending("");
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    if ("empty" in outcome && outcome.empty) toast(messages.operator.slotAlreadyEmpty, "alert");
    else if ("storageFailed" in outcome && outcome.storageFailed) toast(messages.operator.storageFailed, "alert");
    else toast(messages.operator.removed, "status");
    setFilledById((current) => ({
      ...current,
      [row.id]: (current[row.id] ?? row.filled).filter((held) => held !== slot),
    }));
    router.refresh();
  }

  async function remove(row: CampaignOfferView) {
    if (pending) return;
    const accepted = await confirm(messages.operator.remove, fillMessage(messages.operator.removeConfirm, { code: row.code }));
    if (!accepted) return;
    setPending(row.id);
    const outcome = await removeCampaignOffer(locale, row.id);
    setPending("");
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    toast(outcome.storageFailed ? messages.operator.storageFailed : messages.operator.removed, outcome.storageFailed ? "alert" : "status");
    setHiding(row.id);
    window.setTimeout(() => {
      setRemovedIds((current) => [...current, row.id]);
      setHiding("");
    }, 300);
    router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <input
        className={fieldClass}
        value={query}
        aria-label={messages.operator.searchCampaignOffers}
        placeholder={messages.operator.searchCampaignOffers}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <div className="flex min-w-0 flex-wrap gap-2">
        {statusFilters.map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={status === entry && !gap}
            className={`rounded-button px-3 py-2 text-sm ${status === entry && !gap ? "bg-primary text-surface" : "border border-border"}`}
            onClick={() => {
              setStatus(entry);
              setGap(false);
            }}
          >
            {filterLabel(locale, entry)}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p>{messages.operator.emptyCampaignOffers}</p> : null}
      <ul className="flex min-w-0 flex-col gap-3">
        {shown.map((row) => (
          <li
            key={row.id}
            data-code={row.code}
            className={`${cardClass} flex min-w-0 flex-col gap-3 ${hiding === row.id ? "opacity-0 transition-opacity motion-reduce:transition-none" : ""}`}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <LatinRun>{row.code}</LatinRun>
                </p>
                <p className="break-words">{row.nameAr}</p>
                <p className="break-words">
                  <LatinRun>{row.nameEn}</LatinRun>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SlideSwitch
                  checked={row.status !== "off"}
                  disabled={pending === row.id}
                  label={messages.operator.shownLabel}
                  onToggle={() => void toggleShown(row)}
                />
                <span className="text-sm">{statusLabel(locale, row.status)}</span>
              </div>
            </div>
            <p className="text-sm">
              <LatinRun>{row.price}</LatinRun>
              {" · "}
              <LatinRun>{row.start}</LatinRun>
              {" – "}
              <LatinRun>{row.end}</LatinRun>
            </p>
            <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
              {slotOrder.map((slot) => {
                const present = row.filled.includes(slot);
                const href = `${operatorPath(locale, "media-objects")}?code=${encodeURIComponent(row.code)}&slot=${slot}`;
                return (
                  <li key={slot} data-filled={present ? "yes" : "no"} className="flex min-w-0 flex-wrap items-center gap-2 rounded-button border border-border px-3 py-2 text-sm">
                    <SlotMark slot={slot} />
                    <span className="min-w-0 flex-1">{slotText(messages, slot)}</span>
                    <span className="text-muted">{present ? messages.operator.assigned : messages.operator.slotEmpty}</span>
                    <a className="text-primary" href={href}>
                      {messages.operator.slotAdd}
                    </a>
                    {present ? (
                      <button
                        type="button"
                        className="text-sm"
                        aria-label={`${messages.operator.remove} ${slotText(messages, slot)}`}
                        onClick={() => void removeSlot(row, slot)}
                      >
                        {messages.operator.remove}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-button border border-border px-3 py-2 text-sm"
                aria-expanded={menu === row.id}
                onClick={() => setMenu((current) => (current === row.id ? "" : row.id))}
              >
                {messages.operator.more}
              </button>
            </div>
            {menu === row.id ? (
              <BusyButton
                busy={pending === row.id}
                quiet
                label={messages.operator.remove}
                pendingLabel={messages.operator.pending}
                onClick={() => void remove(row)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
