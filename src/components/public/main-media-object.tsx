"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { usePreview } from "@/components/public/gallery-preview";

type MainMediaObjectProps = {
  clipUrl: string | null;
  pictureUrl: string | null;
  pictureAlt: string;
  playLabel: string;
  previewIndex: number | null;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function MainMediaObject({ clipUrl, pictureUrl, pictureAlt, playLabel, previewIndex }: MainMediaObjectProps) {
  const { openAt } = usePreview();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="w-full self-start overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {clipUrl ? (
        <div className="relative bg-primary-soft">
          <video
            ref={videoRef}
            className="block h-auto max-h-[75dvh] w-full object-contain"
            controls
            preload="metadata"
            playsInline
            poster={pictureUrl ?? undefined}
            src={clipUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {playing ? null : (
            <button
              type="button"
              className={`absolute inset-0 flex items-center justify-center ${focusRing}`}
              aria-label={playLabel}
              onClick={() => {
                const playback = videoRef.current?.play();
                if (playback) void playback.then(() => undefined, () => undefined);
              }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-button bg-surface text-primary shadow-card">
                <Play className="h-7 w-7 fill-current" aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      ) : pictureUrl ? (
        <button
          type="button"
          className={`block w-full bg-primary-soft ${focusRing}`}
          onClick={(event) => {
            if (previewIndex === null) return;
            openAt(previewIndex, event.currentTarget);
          }}
        >
          {/* CSP has no style-src, and next/image writes an inline style. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pictureUrl} alt={pictureAlt} className="block h-auto max-h-[75dvh] w-full object-contain" />
        </button>
      ) : (
        <div className="aspect-[16/10] bg-primary-soft" />
      )}
    </figure>
  );
}
