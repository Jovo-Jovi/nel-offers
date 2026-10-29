"use client";

import { Image as ImageIcon, LoaderCircle as Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeCampaignOffer, removeCampaignOfferMedia, setCampaignOfferShown } from "@/app/[locale]/operator/(dashboard)/actions";
import { LatinRun } from "@/components/latin-run";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { SlideSwitch } from "@/components/slide-switch";
import { cardClass, fieldClass, focusRing, removeControl } from "@/components/operator-classes";
import { defaultLocale, messagesFor, operatorPath, type Locale } from "@/i18n/config";
import { fillMessage } from "@/lib/fill-message";
import { leaveMs, motionReduced } from "@/lib/leave-motion";
import { slotText } from "@/lib/operator-copy";

const slotOrder = ["main_video", "main_image", "gallery_1", "gallery_2", "gallery_3"] as const;
const statusFilters = ["all", "visible", "scheduled", "ended", "off", "hidden"] as const;

export type SlotPicture = {
  slot: string;
  previewUrl: string;
  video: boolean;
};

export type CampaignOfferView = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  price: string;
  start: string;
  end: string;
  status: string;
  pictures: SlotPicture[];
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

function statusChip(status: string) {
  if (status === "visible") return "bg-primary-soft text-primary";
  if (status === "scheduled") return "bg-primary-soft text-warning";
  if (status === "off") return "bg-primary-soft text-error";
  return "bg-primary-soft text-muted";
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
  const [leavingSlot, setLeavingSlot] = useState("");
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [picturesById, setPicturesById] = useState<Record<string, SlotPicture[]>>({});
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const visible = rows
    .filter((row) => !removedIds.includes(row.id))
    .map((row) => {
      const pictures = picturesById[row.id] ?? row.pictures;
      return {
        ...row,
        status: statusById[row.id] ?? row.status,
        pictures,
        filled: pictures.map((entry) => entry.slot),
      };
    });

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

  async function toggleShown(row: CampaignOfferView & { filled: string[] }) {
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

  async function removeSlot(row: CampaignOfferView & { filled: string[] }, slot: string) {
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
    const dropPicture = (current: Record<string, SlotPicture[]>) => ({
      ...current,
      [row.id]: (current[row.id] ?? row.pictures).filter((entry) => entry.slot !== slot),
    });
    if (motionReduced()) {
      setPicturesById(dropPicture);
      router.refresh();
      return;
    }
    setLeavingSlot(`${row.id}:${slot}`);
    window.setTimeout(() => {
      setPicturesById(dropPicture);
      setLeavingSlot("");
      router.refresh();
    }, leaveMs);
  }

  async function remove(row: CampaignOfferView & { filled: string[] }) {
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
    if (motionReduced()) {
      setRemovedIds((current) => [...current, row.id]);
      router.refresh();
      return;
    }
    setHiding(row.id);
    window.setTimeout(() => {
      setRemovedIds((current) => [...current, row.id]);
      setHiding("");
      router.refresh();
    }, leaveMs);
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
      <p className="text-sm text-muted">{messages.operator.statusLegend}</p>
      {visible.length === 0 ? <p>{messages.operator.emptyCampaignOffers}</p> : null}
      <ul className="flex min-w-0 flex-col gap-3">
        {shown.map((row) => {
          const cover =
            row.pictures.find((entry) => entry.slot === "main_image" && entry.previewUrl) ??
            row.pictures.find((entry) => entry.slot === "main_video" && entry.previewUrl) ??
            null;
          const primaryName = locale === defaultLocale ? row.nameAr : row.nameEn;
          const otherName = locale === defaultLocale ? row.nameEn : row.nameAr;
          return (
            <li
              key={row.id}
              data-code={row.code}
              data-leaving={hiding === row.id ? "true" : undefined}
              className="nel-leave"
            >
              <div
                className={`nel-leave-inner ${cardClass} flex min-w-0 flex-col gap-3 border border-border p-3 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 sm:p-5`}
              >
                <div className="flex min-w-0 flex-wrap items-start gap-3">
                  <div className="flex size-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-card bg-primary-soft md:size-24">
                    {cover?.video && cover.previewUrl ? (
                      <video
                        className="size-full object-cover"
                        src={`${cover.previewUrl}#t=0.1`}
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : cover?.previewUrl ? (
                      // CSP has no style-src, and next/image writes an inline style.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.previewUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-6 text-muted" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <LatinRun>{row.code}</LatinRun>
                      <span className={`rounded-button px-2 py-1 text-xs ${statusChip(row.status)}`}>
                        {statusLabel(locale, row.status)}
                      </span>
                    </p>
                    <p className="break-words text-lg font-bold">
                      {locale === defaultLocale ? primaryName : <LatinRun>{primaryName}</LatinRun>}
                    </p>
                    <p className="break-words text-sm text-muted">
                      {locale === defaultLocale ? <LatinRun>{otherName}</LatinRun> : otherName}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-button bg-primary-soft px-2 py-1 text-xs">
                        <LatinRun>{row.price}</LatinRun> {messages.campaignOffer.currency}
                      </span>
                      <span className="rounded-button bg-primary-soft px-2 py-1 text-xs">
                        {row.start ? (
                          <>
                            <LatinRun>{row.start}</LatinRun>
                            {" – "}
                            <LatinRun>{row.end}</LatinRun>
                          </>
                        ) : (
                          <>
                            {messages.operator.untilDate} <LatinRun>{row.end}</LatinRun>
                          </>
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span data-shown-label className="text-sm">
                      {messages.operator.shownLabel}
                    </span>
                    {pending === row.id ? (
                      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : null}
                    <SlideSwitch
                      checked={row.status !== "off"}
                      disabled={pending === row.id}
                      label={messages.operator.shownLabel}
                      onToggle={() => void toggleShown(row)}
                    />
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={messages.operator.more}
                        aria-expanded={menu === row.id}
                        className={`inline-flex size-11 items-center justify-center rounded-button border border-border text-lg ${focusRing}`}
                        onClick={() => setMenu((current) => (current === row.id ? "" : row.id))}
                      >
                        <span aria-hidden="true">⋮</span>
                      </button>
                      {menu === row.id ? (
                        <div className="absolute end-0 z-10 mt-1 min-w-36 rounded-card border border-border bg-surface p-2 shadow-card">
                          <button
                            type="button"
                            data-remove="true"
                            className={removeControl}
                            disabled={pending === row.id}
                            onClick={() => void remove(row)}
                          >
                            {pending === row.id ? (
                              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            ) : null}
                            {messages.operator.remove}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <ul className="grid min-w-0 grid-cols-5 gap-1">
                  {slotOrder.map((slot) => {
                    const picture = row.pictures.find((entry) => entry.slot === slot) ?? null;
                    const present = picture !== null;
                    const href = `${operatorPath(locale, "media-objects")}?code=${encodeURIComponent(row.code)}&slot=${slot}`;
                    const name = slotText(messages, slot);
                    return (
                      <li
                        key={slot}
                        data-filled={present ? "yes" : "no"}
                        data-leaving={leavingSlot === `${row.id}:${slot}` ? "true" : undefined}
                        className="nel-leave min-w-0"
                      >
                        <div className="nel-leave-inner flex min-w-0 flex-col gap-1">
                          {present ? (
                            <div data-tile className="nel-tile relative aspect-square overflow-hidden rounded-button border border-border">
                              {picture?.video && picture.previewUrl ? (
                                <video
                                  className="nel-arrive size-full object-cover"
                                  src={`${picture.previewUrl}#t=0.1`}
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={picture?.previewUrl} alt="" className="nel-arrive size-full object-cover" />
                              )}
                              <div className="nel-tile-actions absolute inset-0 flex flex-col items-center justify-center gap-1 bg-dark/70 p-0.5">
                                <a className={`text-center text-[0.65rem] font-bold text-surface ${focusRing}`} href={href}>
                                  {messages.operator.slotReplace}
                                </a>
                                <button
                                  type="button"
                                  data-remove="true"
                                  className={`rounded-button border border-error px-1 text-[0.65rem] text-error ${focusRing}`}
                                  disabled={pending === `${row.id}:${slot}`}
                                  aria-label={`${messages.operator.remove} ${name}`}
                                  onClick={() => void removeSlot(row, slot)}
                                >
                                  {pending === `${row.id}:${slot}` ? (
                                    <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                  ) : null}
                                  {messages.operator.remove}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <a
                              data-tile
                              href={href}
                              aria-label={messages.operator.slotAdd}
                              className={`flex aspect-square items-center justify-center rounded-button border border-dashed border-border text-lg ${focusRing}`}
                            >
                              +
                            </a>
                          )}
                          <p className="break-words text-center text-[0.65rem] leading-tight">{name}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
