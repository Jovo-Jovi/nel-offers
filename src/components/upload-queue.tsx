"use client";

import { Clapperboard, Image as ImageIcon, Images } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeCampaignOfferMedia } from "@/app/[locale]/operator/(dashboard)/actions";
import { intlLocale, messagesFor, defaultLocale, type Locale } from "@/i18n/config";
import { BusyButton } from "@/components/submit-button";
import { cardClass, fieldClass } from "@/components/operator-classes";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { fillMessage } from "@/lib/fill-message";
import { megabytes } from "@/lib/format-values";
import { reencodeImage } from "@/lib/image-reencode";
import { encodedImageByteLimit, selectedImageByteLimit, videoByteLimit } from "@/lib/media-object-limits";
import { isUploadSlot, resolveUploadName, uploadSlots, type UploadSlot } from "@/lib/media-object-name";
import { readMp4Location } from "@/lib/mp4-location";
import { slotText } from "@/lib/operator-copy";

type QueueStatus = "ready" | "waiting" | "uploading" | "done" | "refused" | "failed";
type PickerKind = "video" | "image";
type QueueTab = "videos" | "images";

type QueueRow = {
  id: string;
  previewUrl: string;
  status: QueueStatus;
  reason: string;
  limit: number;
  code: string;
  slot: string;
  replaces: boolean;
  size: number;
  loaded: number;
  total: number;
  body: Blob | null;
  mime: string;
  video: boolean;
};

export type CampaignOfferChoice = {
  code: string;
  nameAr: string;
  nameEn: string;
};

export type LibraryEntry = {
  campaignOfferId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  slot: string;
  previewUrl: string;
  video: boolean;
};

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const imageSlots = uploadSlots.filter((slot) => slot !== "main_video");

function reasonLabel(locale: Locale, row: QueueRow) {
  const messages = messagesFor(locale);
  if (row.reason === "ambiguous") return messages.operator.reasonAmbiguous;
  if (row.reason === "unknown-code") return messages.operator.reasonUnknownCode;
  if (row.reason === "video-in-gallery") return messages.operator.reasonVideoInGallery;
  if (row.reason === "bad-extension") return messages.operator.reasonBadExtension;
  if (row.reason === "location") return messages.operator.reasonLocation;
  if (row.reason === "unreadable") return messages.operator.reasonUnreadable;
  if (row.reason === "wrong-type") return messages.operator.reasonWrongBrowser;
  if (row.reason === "duplicate-slot") return messages.operator.duplicateSlot;
  if (row.reason === "too-large") {
    return fillMessage(messages.operator.reasonTooLarge, { megabytes: megabytes(row.limit) });
  }
  if (row.reason === "encoded-too-large") {
    return fillMessage(messages.operator.reasonEncoded, { megabytes: megabytes(row.limit) });
  }
  if (row.reason === "already-recorded") return messages.operator.alreadyRecorded;
  if (row.reason.length > 0) return messages.operator.rejected;
  return "";
}

function putBytes(url: string, body: Blob, mime: string, onProgress: (loaded: number, total: number) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", mime);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(body);
  });
}

function SlotIcon({ slot }: { slot: string }) {
  if (slot === "main_video") return <Clapperboard className="size-5" aria-hidden="true" />;
  if (slot.startsWith("gallery")) return <Images className="size-5" aria-hidden="true" />;
  return <ImageIcon className="size-5" aria-hidden="true" />;
}

function extensionOf(name: string) {
  const slash = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  const leaf = slash >= 0 ? name.slice(slash + 1) : name;
  const dot = leaf.lastIndexOf(".");
  return dot >= 0 ? leaf.slice(dot + 1).toLowerCase() : "";
}

export function UploadQueue({
  locale,
  codeKeys,
  occupied,
  campaignOffers,
  library,
  initialCode,
  initialSlot,
}: {
  locale: Locale;
  codeKeys: string[];
  occupied: string[];
  campaignOffers: CampaignOfferChoice[];
  library: LibraryEntry[];
  initialCode: string;
  initialSlot: string;
}) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const router = useRouter();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<QueueTab>("images");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [held, setHeld] = useState(() => new Set(occupied));
  const heldRef = useRef(held);
  const rowsRef = useRef(rows);
  const keys = new Set(codeKeys);
  const queryCode = campaignOffers.some((row) => row.code === initialCode) ? initialCode : "";
  const querySlot = isUploadSlot(initialSlot) ? initialSlot : "";

  useEffect(() => {
    heldRef.current = held;
    rowsRef.current = rows;
  }, [held, rows]);

  function patch(id: string, change: Partial<QueueRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }

  function claimKey(code: string, slot: string) {
    return `${code}:${slot}`;
  }

  async function enqueue(chosen: File[], kind: PickerKind) {
    const next: QueueRow[] = [];
    const claimed = new Set(
      rowsRef.current
        .filter(
          (row) =>
            row.code &&
            row.slot &&
            (row.status === "ready" || row.status === "waiting" || row.status === "uploading"),
        )
        .map((row) => claimKey(row.code, row.slot)),
    );
    let queryUsed = false;
    for (const blob of chosen) {
      const extension = extensionOf(blob.name);
      const video = extension === "mp4";
      const image = imageExtensions.has(extension);
      const base: QueueRow = {
        id: crypto.randomUUID(),
        previewUrl: "",
        status: "refused",
        reason: "",
        limit: 0,
        code: "",
        slot: "",
        replaces: false,
        size: blob.size,
        loaded: 0,
        total: blob.size,
        body: null,
        mime: "",
        video,
      };
      if ((kind === "video" && !video) || (kind === "image" && !image)) {
        next.push({ ...base, reason: "bad-extension" });
        continue;
      }
      const resolved = resolveUploadName(blob.name, keys);
      if ("refusal" in resolved && resolved.refusal !== "unknown-code") {
        next.push({ ...base, reason: resolved.refusal });
        continue;
      }
      if ("code" in resolved) {
        base.code = resolved.code;
        base.slot = resolved.slot;
      } else if (!queryUsed && queryCode && querySlot && (kind === "video" ? querySlot === "main_video" : querySlot !== "main_video")) {
        base.code = queryCode;
        base.slot = querySlot;
        queryUsed = true;
      }
      if (video) {
        if (blob.size > videoByteLimit) {
          next.push({ ...base, reason: "too-large", limit: videoByteLimit });
          continue;
        }
        const located = await readMp4Location(blob);
        if (!("clean" in located)) {
          next.push({ ...base, reason: located.refusal });
          continue;
        }
        base.body = blob;
        base.mime = "video/mp4";
      } else {
        if (blob.size > selectedImageByteLimit) {
          next.push({ ...base, reason: "too-large", limit: selectedImageByteLimit });
          continue;
        }
        const encoded = await reencodeImage(blob);
        if ("refusal" in encoded) {
          next.push({
            ...base,
            reason: encoded.refusal,
            limit: encoded.refusal === "too-large" ? selectedImageByteLimit : encodedImageByteLimit,
          });
          continue;
        }
        base.body = encoded.blob;
        base.mime = "image/webp";
        base.size = encoded.blob.size;
        base.total = encoded.blob.size;
        base.previewUrl = URL.createObjectURL(encoded.blob);
      }
      if (!base.code || !base.slot) {
        next.push({ ...base, status: "waiting" });
        continue;
      }
      const key = claimKey(base.code, base.slot);
      if (claimed.has(key)) {
        next.push({ ...base, status: "refused", reason: "duplicate-slot" });
        continue;
      }
      claimed.add(key);
      next.push({
        ...base,
        status: "ready",
        replaces: heldRef.current.has(key),
      });
    }
    setRows((current) => [...current, ...next]);
  }

  function assign(id: string, code: string, slot: string) {
    setRows((current) => {
      const duplicate =
        code.length > 0 &&
        slot.length > 0 &&
        current.some(
          (row) =>
            row.id !== id &&
            row.code === code &&
            row.slot === slot &&
            (row.status === "ready" || row.status === "waiting" || row.status === "uploading"),
        );
      return current.map((row) => {
        if (row.id !== id || (row.status !== "waiting" && row.status !== "ready" && row.status !== "refused")) return row;
        if (row.reason && row.reason !== "duplicate-slot" && row.status === "refused") return row;
        if (!code || !slot) {
          return { ...row, code, slot, status: row.body ? "waiting" : row.status, reason: "", replaces: false };
        }
        if (duplicate || !row.body) {
          return { ...row, code, slot, status: "refused", reason: "duplicate-slot", replaces: false };
        }
        return {
          ...row,
          code,
          slot,
          status: "ready",
          reason: "",
          replaces: heldRef.current.has(claimKey(code, slot)),
        };
      });
    });
  }

  async function uploadRow(row: QueueRow) {
    if (!row.body || !row.code || !row.slot) return;
    patch(row.id, { status: "uploading", loaded: 0, total: row.body.size });
    const presign = await fetch("/api/operator/media-objects/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: row.code, slot: row.slot, type: row.mime, size: row.body.size }),
    });
    const presignBody = (await presign.json()) as { objectKey?: string; uploadUrl?: string; code?: string };
    if (!presign.ok || !presignBody.objectKey || !presignBody.uploadUrl) {
      patch(row.id, { status: "failed", reason: presignBody.code ?? "rejected" });
      return;
    }
    const sent = await putBytes(presignBody.uploadUrl, row.body, row.mime, (loaded, total) => {
      patch(row.id, { loaded, total });
    });
    if (!sent) {
      patch(row.id, { status: "failed", reason: "rejected" });
      return;
    }
    const finalised = await fetch("/api/operator/media-objects/finalise", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objectKey: presignBody.objectKey, code: row.code, slot: row.slot }),
    });
    const finalBody = (await finalised.json()) as { code?: string };
    if (!finalised.ok) {
      patch(row.id, { status: "failed", reason: finalBody.code ?? "rejected" });
      return;
    }
    const storedKey = claimKey(row.code, row.slot);
    setHeld((current) => new Set(current).add(storedKey));
    patch(row.id, { status: "done", loaded: row.body.size, total: row.body.size });
  }

  async function uploadReady() {
    if (busy) return;
    const ready = rows.filter((row) => row.status === "ready");
    if (ready.length === 0) return;
    const replacements = ready.filter((row) => row.replaces);
    if (replacements.length > 0) {
      const targets = replacements
        .map((row) => fillMessage(messages.operator.uploadTarget, { code: row.code, slot: slotText(messages, row.slot) }))
        .join(", ");
      const accepted = await confirm(
        messages.operator.uploadAction,
        fillMessage(messages.operator.replaceConfirm, { targets }),
      );
      if (!accepted) return;
    }
    setBusy(true);
    let cursor = 0;
    async function lane() {
      while (cursor < ready.length) {
        const index = cursor;
        cursor += 1;
        const row = ready[index];
        if (row) await uploadRow(row);
      }
    }
    const lanes = Math.min(3, ready.length);
    await Promise.all(Array.from({ length: lanes }, () => lane()));
    setBusy(false);
    toast(messages.operator.saved, "status");
    router.refresh();
  }

  function clearList() {
    setRows((current) => {
      for (const row of current) {
        if (row.previewUrl) URL.revokeObjectURL(row.previewUrl);
      }
      return [];
    });
  }

  const filteredLibrary = library.filter((entry) => {
    const needle = libraryQuery.trim().toLowerCase();
    if (!needle) return true;
    return (
      entry.code.toLowerCase().includes(needle) ||
      entry.nameAr.toLowerCase().includes(needle) ||
      entry.nameEn.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div role="tablist" className="flex min-w-0 flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "videos"}
          className={`rounded-button px-3 py-2 text-sm ${tab === "videos" ? "bg-primary text-surface" : "border border-border"}`}
          onClick={() => setTab("videos")}
        >
          {messages.operator.tabVideos}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "images"}
          className={`rounded-button px-3 py-2 text-sm ${tab === "images" ? "bg-primary text-surface" : "border border-border"}`}
          onClick={() => setTab("images")}
        >
          {messages.operator.tabImages}
        </button>
      </div>
      <Picker
        hidden={tab !== "videos"}
        inputId="uploads-videos"
        accept="video/mp4,.mp4"
        label={messages.operator.dropUploads}
        choose={messages.operator.chooseUploads}
        onPick={(picked) => void enqueue(picked, "video")}
      />
      <Picker
        hidden={tab !== "images"}
        inputId="uploads-images"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        label={messages.operator.dropUploads}
        choose={messages.operator.chooseUploads}
        onPick={(picked) => void enqueue(picked, "image")}
      />
      <p className="text-sm text-muted">{messages.operator.clearListNote}</p>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} data-upload={row.status} className={`${cardClass} flex flex-wrap items-center gap-3`}>
            {row.previewUrl ? (
              // CSP has no style-src, and next/image writes an inline style.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.previewUrl} alt="" className="h-16 w-16 rounded-card object-cover" />
            ) : (
              <SlotIcon slot={row.slot} />
            )}
            <div className="min-w-0 flex-1">
              {row.code && row.slot ? (
                <p className="text-sm">
                  {fillMessage(messages.operator.uploadTarget, { code: row.code, slot: slotText(messages, row.slot) })}
                </p>
              ) : null}
              <p className="text-xs text-muted">{new Intl.NumberFormat(intlLocale(locale)).format(row.size)}</p>
              {row.replaces ? <p className="text-sm">{messages.operator.replaces}</p> : null}
              {row.replaces ? <p className="text-sm">{messages.operator.assigned}</p> : null}
              {row.status === "waiting" ? <p className="text-sm">{messages.operator.waitingChoice}</p> : null}
              {row.reason ? <p className="text-sm text-error">{reasonLabel(locale, row)}</p> : null}
              {row.status === "waiting" || row.status === "ready" || row.reason === "duplicate-slot" ? (
                <ChoiceFields
                  locale={locale}
                  campaignOffers={campaignOffers}
                  video={row.video}
                  code={row.code}
                  slot={row.slot}
                  occupied={held}
                  onAssign={(code, slot) => assign(row.id, code, slot)}
                />
              ) : null}
              {row.status === "uploading" ? (
                <progress
                  className="nel-progress mt-2"
                  max={row.total || 1}
                  value={row.loaded}
                  aria-label={messages.operator.progressLabel}
                />
              ) : null}
              <p className="text-xs">
                {row.status === "done" ? messages.operator.done : null}
                {row.status === "refused" ? messages.operator.refused : null}
                {row.status === "failed" ? messages.operator.failed : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <BusyButton
          busy={busy}
          label={messages.operator.uploadAction}
          pendingLabel={messages.operator.pending}
          onClick={() => void uploadReady()}
        />
        <BusyButton
          busy={false}
          quiet
          label={messages.operator.clearList}
          pendingLabel={messages.operator.pending}
          onClick={clearList}
        />
      </div>
      <LibraryList
        locale={locale}
        entries={filteredLibrary}
        query={libraryQuery}
        onQuery={setLibraryQuery}
        onRemoved={() => router.refresh()}
      />
    </div>
  );
}

function Picker({
  hidden,
  inputId,
  accept,
  label,
  choose,
  onPick,
}: {
  hidden: boolean;
  inputId: string;
  accept: string;
  label: string;
  choose: string;
  onPick: (picked: File[]) => void;
}) {
  if (hidden) return null;
  return (
    <div
      data-drop-zone="true"
      className={`${cardClass} border border-dashed border-border`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onPick(Array.from(event.dataTransfer.files));
      }}
    >
      <p className="text-sm">{label}</p>
      <label className="mt-3 inline-flex cursor-pointer">
        <span className="rounded-button bg-primary px-4 py-2 text-sm text-surface">{choose}</span>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          multiple
          accept={accept}
          onChange={(event) => {
            const input = event.currentTarget;
            const read = () => {
              const picked = Array.from(input.files ?? []);
              if (picked.length === 0) return;
              input.value = "";
              onPick(picked);
            };
            read();
            window.setTimeout(read, 0);
          }}
        />
      </label>
    </div>
  );
}

function ChoiceFields({
  locale,
  campaignOffers,
  video,
  code,
  slot,
  occupied,
  onAssign,
}: {
  locale: Locale;
  campaignOffers: CampaignOfferChoice[];
  video: boolean;
  code: string;
  slot: string;
  occupied: Set<string>;
  onAssign: (code: string, slot: string) => void;
}) {
  const messages = messagesFor(locale);
  const [needle, setNeedle] = useState("");
  const slots: readonly UploadSlot[] = video ? ["main_video"] : imageSlots;
  const filtered = campaignOffers.filter((row) => {
    const query = needle.trim().toLowerCase();
    if (!query) return true;
    const name = locale === defaultLocale ? row.nameAr : row.nameEn;
    return row.code.toLowerCase().includes(query) || name.toLowerCase().includes(query) || row.nameAr.toLowerCase().includes(query) || row.nameEn.toLowerCase().includes(query);
  });
  return (
    <div className="mt-2 flex min-w-0 flex-col gap-2">
      <input
        className={fieldClass}
        value={needle}
        aria-label={messages.operator.searchCampaignOffers}
        placeholder={messages.operator.searchCampaignOffers}
        onChange={(event) => setNeedle(event.currentTarget.value)}
      />
      <label className="flex min-w-0 flex-col gap-1 text-sm">
        {messages.operator.chooseCampaignOffer}
        <select
          className={fieldClass}
          aria-label={messages.operator.chooseCampaignOffer}
          value={code}
          onChange={(event) => onAssign(event.currentTarget.value, slot)}
        >
          <option value="">{messages.operator.chooseCampaignOffer}</option>
          {filtered.map((row) => (
            <option key={row.code} value={row.code}>
              {row.code} {locale === defaultLocale ? row.nameAr : row.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">
        {messages.operator.chooseSlot}
        <select
          className={fieldClass}
          aria-label={messages.operator.chooseSlot}
          value={slot}
          onChange={(event) => onAssign(code, event.currentTarget.value)}
        >
          <option value="">{messages.operator.chooseSlot}</option>
          {slots.map((entry) => {
            const held = code ? occupied.has(`${code}:${entry}`) : false;
            return (
              <option key={entry} value={entry}>
                {slotText(messages, entry)}
                {held ? ` — ${messages.operator.assigned}` : ""}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}

function LibraryList({
  locale,
  entries,
  query,
  onQuery,
  onRemoved,
}: {
  locale: Locale;
  entries: LibraryEntry[];
  query: string;
  onQuery: (value: string) => void;
  onRemoved: () => void;
}) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const [pending, setPending] = useState("");

  async function remove(entry: LibraryEntry) {
    if (pending) return;
    const accepted = await confirm(
      messages.operator.remove,
      fillMessage(messages.operator.slotRemoveConfirm, {
        code: entry.code,
        slot: slotText(messages, entry.slot),
      }),
    );
    if (!accepted) return;
    setPending(`${entry.campaignOfferId}:${entry.slot}`);
    const outcome = await removeCampaignOfferMedia(locale, entry.campaignOfferId, entry.slot);
    setPending("");
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    if ("empty" in outcome && outcome.empty) toast(messages.operator.slotAlreadyEmpty, "alert");
    else if ("storageFailed" in outcome && outcome.storageFailed) toast(messages.operator.storageFailed, "alert");
    else toast(messages.operator.removed, "status");
    onRemoved();
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-lg">{messages.operator.libraryHeading}</h2>
      <input
        className={fieldClass}
        value={query}
        aria-label={messages.operator.librarySearch}
        placeholder={messages.operator.librarySearch}
        onChange={(event) => onQuery(event.currentTarget.value)}
      />
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => {
          const name = locale === defaultLocale ? entry.nameAr : entry.nameEn;
          return (
            <li key={`${entry.campaignOfferId}:${entry.slot}`} data-library={`${entry.code}:${entry.slot}`} className={cardClass}>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                {entry.previewUrl && entry.video ? (
                  <video
                    className="h-16 w-16 rounded-card object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    src={`${entry.previewUrl}#t=0.1`}
                  />
                ) : entry.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.previewUrl} alt="" className="h-16 w-16 rounded-card object-cover" />
                ) : (
                  <SlotIcon slot={entry.slot} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{entry.code}</p>
                  <p className="break-words text-sm">{name}</p>
                  <p className="text-sm">{slotText(messages, entry.slot)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-button border border-border px-3 py-2 text-sm"
                  disabled={pending === `${entry.campaignOfferId}:${entry.slot}`}
                  onClick={() => void remove(entry)}
                >
                  {messages.operator.remove}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
