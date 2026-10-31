"use client";

import { useEffect, useRef } from "react";

type BannerVideoProps = {
  src: string;
  label: string;
};

export function BannerVideo({ src, label }: BannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const player = video;
    function start() {
      player.muted = true;
      const playback = player.play();
      if (playback) void playback.then(() => undefined, () => undefined);
    }
    function onVisible() {
      if (document.visibilityState === "visible" && player.paused) start();
    }
    start();
    player.addEventListener("pause", start);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      player.removeEventListener("pause", start);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="relative h-64 w-full sm:h-80 lg:h-full lg:min-h-[28rem]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={label}
      />
    </div>
  );
}
