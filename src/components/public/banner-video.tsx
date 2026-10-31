"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type BannerVideoProps = {
  src: string;
  label: string;
  pauseLabel: string;
  playLabel: string;
};

export function BannerVideo({ src, label, pauseLabel, playLabel }: BannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;
    const playback = video.play();
    if (playback) void playback.then(() => setPlaying(true), () => undefined);
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      const playback = video.play();
      if (playback) void playback.then(() => setPlaying(true), () => undefined);
      return;
    }
    video.pause();
    setPlaying(false);
  }

  return (
    <div className="relative h-64 w-full sm:h-80 lg:h-full lg:min-h-[28rem]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
      <button
        type="button"
        className={`absolute bottom-3 end-3 inline-flex h-11 w-11 items-center justify-center rounded-button bg-surface text-primary shadow-card ${focusRing}`}
        aria-label={playing ? pauseLabel : playLabel}
        onClick={toggle}
      >
        {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
