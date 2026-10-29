"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeBanner } from "@/app/[locale]/operator/(dashboard)/actions";
import { cardClass } from "@/components/operator-classes";
import { useOperatorFeedback } from "@/components/operator-feedback";
import { BusyButton } from "@/components/submit-button";
import { messagesFor, type Locale } from "@/i18n/config";
import { reencodeImage } from "@/lib/image-reencode";
import { encodedImageByteLimit, selectedImageByteLimit } from "@/lib/media-object-limits";
import { fillMessage } from "@/lib/fill-message";
import { megabytes } from "@/lib/format-values";

function putBytes(url: string, body: Blob, mime: string) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", mime);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(body);
  });
}

export function BannerPanel({
  locale,
  bannerKey,
  bannerUrl,
}: {
  locale: Locale;
  bannerKey: string;
  bannerUrl: string;
}) {
  const messages = messagesFor(locale);
  const { toast, confirm } = useOperatorFeedback();
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState("");
  const [body, setBody] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(blob: Blob | null) {
    if (!blob) return;
    if (blob.size > selectedImageByteLimit) {
      toast(fillMessage(messages.operator.reasonTooLarge, { megabytes: megabytes(selectedImageByteLimit) }), "alert");
      return;
    }
    const encoded = await reencodeImage(blob);
    if ("refusal" in encoded) {
      const reason =
        encoded.refusal === "wrong-type"
          ? messages.operator.reasonWrongBrowser
          : encoded.refusal === "encoded-too-large"
            ? fillMessage(messages.operator.reasonEncoded, { megabytes: megabytes(encodedImageByteLimit) })
            : messages.operator.reasonUnreadable;
      toast(reason, "alert");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBody(encoded.blob);
    setPreviewUrl(URL.createObjectURL(encoded.blob));
  }

  async function upload() {
    if (!body || busy) return;
    setBusy(true);
    const presign = await fetch("/api/operator/campaign-banner/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "image/webp", size: body.size }),
    });
    const presignBody = (await presign.json()) as { objectKey?: string; uploadUrl?: string };
    if (!presign.ok || !presignBody.objectKey || !presignBody.uploadUrl) {
      setBusy(false);
      toast(messages.operator.rejected, "alert");
      return;
    }
    const sent = await putBytes(presignBody.uploadUrl, body, "image/webp");
    if (!sent) {
      setBusy(false);
      toast(messages.operator.rejected, "alert");
      return;
    }
    const finalised = await fetch("/api/operator/campaign-banner/finalise", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objectKey: presignBody.objectKey }),
    });
    setBusy(false);
    if (!finalised.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    toast(messages.operator.saved, "status");
    setBody(null);
    router.refresh();
  }

  async function remove() {
    if (busy) return;
    const accepted = await confirm(messages.operator.bannerRemove, messages.operator.bannerRemoveConfirm);
    if (!accepted) return;
    setBusy(true);
    const outcome = await removeBanner(locale);
    setBusy(false);
    if (!outcome.ok) {
      toast(messages.operator.rejected, "alert");
      return;
    }
    toast(outcome.storageFailed ? messages.operator.storageFailed : messages.operator.removed, outcome.storageFailed ? "alert" : "status");
    router.refresh();
  }

  return (
    <section className={`${cardClass} flex min-w-0 flex-col gap-3`}>
      <h2 className="text-lg">{messages.operator.bannerHeading}</h2>
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-banner-key={bannerKey} src={bannerUrl} alt={messages.operator.bannerCurrent} className="max-w-full rounded-card" />
      ) : (
        <p>{messages.operator.bannerNone}</p>
      )}
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={messages.operator.bannerPreview} className="max-w-full rounded-card" />
      ) : null}
      <label className="inline-flex cursor-pointer">
        <span className="rounded-button border border-border px-4 py-2 text-sm">{messages.operator.bannerChoose}</span>
        <input
          id="banner"
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const input = event.currentTarget;
            const read = () => {
              const picked = input.files?.[0] ?? null;
              if (!picked) return;
              input.value = "";
              void choose(picked);
            };
            read();
            window.setTimeout(read, 0);
          }}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <BusyButton
          busy={busy}
          disabled={!body}
          label={bannerKey ? messages.operator.bannerReplace : messages.operator.bannerUpload}
          pendingLabel={messages.operator.pending}
          onClick={() => void upload()}
        />
        {bannerKey ? (
          <BusyButton busy={busy} danger label={messages.operator.bannerRemove} pendingLabel={messages.operator.pending} onClick={() => void remove()} />
        ) : null}
      </div>
    </section>
  );
}
