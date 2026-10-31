"use client";

import { Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type BannerVideoProps = {
  src: string;
  label: string;
  playLabel: string;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function BannerVideo({ src, label, playLabel }: BannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [held, setHeld] = useState(false);

  const start = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const player = video;
    player.muted = true;
    const playback = player.play();
    if (playback) {
      void playback.then(
        () => setHeld(false),
        () => setHeld(true),
      );
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const player = video;

    function onPlaying() {
      setHeld(false);
    }
    function onPause() {
      start();
    }
    function onVisible() {
      if (document.visibilityState === "visible" && player.paused) start();
    }
    function onDocumentClick() {
      if (player.paused) start();
    }

    start();
    player.addEventListener("playing", onPlaying);
    player.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("click", onDocumentClick);
    return () => {
      player.removeEventListener("playing", onPlaying);
      player.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("click", onDocumentClick);
    };
  }, [start]);

  return (
    <div className="relative h-64 w-full sm:h-80 lg:h-full lg:min-h-[28rem]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src={`${src}#t=0.1`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={label}
      />
      {held ? (
        <button type="button" className={`absolute inset-0 flex items-center justify-center ${focusRing}`} aria-label={playLabel} onClick={start}>
          <span className="flex h-16 w-16 items-center justify-center rounded-button bg-surface text-primary shadow-card">
            <Play className="h-7 w-7 fill-current" aria-hidden="true" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
