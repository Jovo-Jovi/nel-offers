"use client";

import { Clapperboard, Image as ImageIcon, Images } from "lucide-react";
import { useRef, useState } from "react";
import { intlLocale, messagesFor, type Locale } from "@/i18n/config";
import { BusyButton } from "@/components/submit-button";
import { cardClass } from "@/components/operator-classes";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { fillMessage } from "@/lib/fill-message";
import { megabytes } from "@/lib/format-values";
import { reencodeImage } from "@/lib/image-reencode";
import {
  encodedImageByteLimit,
  selectedImageByteLimit,
  videoByteLimit,
} from "@/lib/media-object-limits";
import { resolveUploadName, type UploadSlot } from "@/lib/media-object-name";
import { readMp4Location } from "@/lib/mp4-location";

type QueueStatus = "ready" | "uploading" | "done" | "refused" | "failed";

type QueueRow = {
  id: string;
  leaf: string;
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

function reasonLabel(locale: Locale, row: QueueRow) {
  const messages = messagesFor(locale);
  if (row.reason === "ambiguous") return messages.operator.reasonAmbiguous;
  if (row.reason === "unknown-code") return messages.operator.reasonUnknownCode;
  if (row.reason === "video-in-gallery") return messages.operator.reasonVideoInGallery;
  if (row.reason === "bad-extension") return messages.operator.reasonBadExtension;
  if (row.reason === "location") return messages.operator.reasonLocation;
  if (row.reason === "unreadable") return messages.operator.reasonUnreadable;
  if (row.reason === "wrong-type") return messages.operator.reasonWrongBrowser;
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

export function UploadQueue({
  locale,
  codeKeys,
  occupied,
}: {
  locale: Locale;
  codeKeys: string[];
  occupied: string[];
}) {
  const messages = messagesFor(locale);
  const { toast } = useOperatorFeedback();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [busy, setBusy] = useState(false);
  const occupiedRef = useRef(new Set(occupied));
  const keys = new Set(codeKeys);

  function patch(id: string, change: Partial<QueueRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }

  async function enqueue(chosen: File[]) {
    const next: QueueRow[] = [];
    for (const blob of chosen) {
      const leaf = blob.name;
      const resolved = resolveUploadName(leaf, keys);
      const base: QueueRow = {
        id: crypto.randomUUID(),
        leaf,
        previewUrl: "",
        status: "refused",
        reason: "refusal" in resolved ? resolved.refusal : "",
        limit: 0,
        code: "code" in resolved ? resolved.code : "",
        slot: "slot" in resolved ? resolved.slot : "",
        replaces: false,
        size: blob.size,
        loaded: 0,
        total: blob.size,
        body: null,
        mime: "",
        video: false,
      };
      if ("refusal" in resolved) {
        next.push(base);
        continue;
      }
      const slot: UploadSlot = resolved.slot;
      const video = slot === "main_video";
      base.video = video;
      base.replaces = occupiedRef.current.has(`${resolved.code}:${slot}`);
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
        next.push({ ...base, status: "ready", body: blob, mime: "video/mp4" });
        continue;
      }
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
      next.push({
        ...base,
        status: "ready",
        body: encoded.blob,
        mime: "image/webp",
        size: encoded.blob.size,
        total: encoded.blob.size,
        previewUrl: URL.createObjectURL(encoded.blob),
      });
    }
    setRows((current) => [...current, ...next]);
  }

  async function uploadRow(row: QueueRow) {
    if (!row.body) return;
    patch(row.id, { status: "uploading", loaded: 0, total: row.body.size });
    const presign = await fetch("/api/operator/media-objects/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: row.leaf, type: row.mime, size: row.body.size }),
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
    occupiedRef.current.add(`${row.code}:${row.slot}`);
    patch(row.id, { status: "done", loaded: row.body.size, total: row.body.size });
  }

  async function uploadReady() {
    if (busy) return;
    const ready = rows.filter((row) => row.status === "ready");
    if (ready.length === 0) return;
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
  }

  function clearFinished() {
    setRows((current) => {
      for (const row of current) {
        if (row.status === "done" && row.previewUrl) URL.revokeObjectURL(row.previewUrl);
      }
      return current.filter((row) => row.status !== "done");
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div
        className={`${cardClass} border border-dashed border-border`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void enqueue(Array.from(event.dataTransfer.files));
        }}
      >
        <p className="text-sm">{messages.operator.dropUploads}</p>
        <label className="mt-3 inline-flex cursor-pointer">
          <span className="rounded-button bg-primary px-4 py-2 text-sm text-surface">{messages.operator.chooseUploads}</span>
          <input
            id="uploads"
            className="sr-only"
            type="file"
            multiple
            onChange={(event) => {
              const input = event.currentTarget;
              const read = () => {
                const picked = Array.from(input.files ?? []);
                if (picked.length === 0) return;
                input.value = "";
                void enqueue(picked);
              };
              read();
              window.setTimeout(read, 0);
            }}
          />
        </label>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            data-upload={row.status}
            className={`${cardClass} flex flex-wrap items-center gap-3 transition-opacity duration-300 motion-reduce:transition-none`}
          >
            {row.previewUrl ? (
              // CSP has no style-src, and next/image writes an inline style.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.previewUrl} alt="" className="h-16 w-16 rounded-card object-cover" />
            ) : (
              <SlotIcon slot={row.slot} />
            )}
            <div className="min-w-0 flex-1">
              {row.code ? (
                <p className="text-sm">{fillMessage(messages.operator.uploadTarget, { code: row.code, slot: row.slot })}</p>
              ) : null}
              <p className="text-xs text-muted">{new Intl.NumberFormat(intlLocale(locale)).format(row.size)}</p>
              {row.replaces ? <p className="text-sm">{messages.operator.replaces}</p> : null}
              {row.reason ? <p className="text-sm text-error">{reasonLabel(locale, row)}</p> : null}
              {row.status === "uploading" ? (
                <progress className="nel-progress mt-2" max={row.total || 1} value={row.loaded} aria-label={messages.operator.progressLabel} />
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
        <BusyButton busy={busy} label={messages.operator.uploadAction} pendingLabel={messages.operator.pending} onClick={() => void uploadReady()} />
        <BusyButton busy={false} quiet label={messages.operator.clearFinished} pendingLabel={messages.operator.pending} onClick={clearFinished} />
      </div>
    </div>
  );
}
