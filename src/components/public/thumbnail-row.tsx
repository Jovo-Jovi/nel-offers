"use client";

import { usePreview } from "@/components/public/gallery-preview";

type Thumb = {
  label: string;
  url: string;
  previewIndex: number;
  active: boolean;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ThumbnailRow({ thumbs }: { thumbs: readonly Thumb[] }) {
  const { openAt } = usePreview();
  if (thumbs.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-3 md:h-full md:grid-cols-1 md:grid-rows-3">
      {thumbs.map((thumb) => (
        <li key={thumb.previewIndex} className="md:min-h-0">
          <button
            type="button"
            aria-current={thumb.active ? "true" : undefined}
            onClick={(event) => openAt(thumb.previewIndex, event.currentTarget)}
            aria-label={thumb.label}
            className={`flex h-full w-full flex-col overflow-hidden rounded-card border bg-primary-soft ${
              thumb.active ? "border-primary" : "border-border"
            } ${focusRing}`}
          >
            {/* CSP has no style-src, and next/image writes an inline style. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.url} alt="" className="aspect-[4/3] w-full object-cover md:aspect-auto md:min-h-0 md:flex-1" />
          </button>
        </li>
      ))}
    </ul>
  );
}
