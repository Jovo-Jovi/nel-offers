import { Play } from "lucide-react";

type MediaSlotProps = {
  src: string;
};

export function MediaSlot({ src }: MediaSlotProps) {
  return (
    <figure className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Replace the img src with an <img> or <video> from the lab. */}
      <div className="relative aspect-[16/10] bg-primary-soft">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-button bg-surface text-primary shadow-card"
            role="img"
            aria-label="أيقونة تشغيل"
          >
            <Play className="h-7 w-7 fill-current" aria-hidden="true" />
          </span>
        </span>
      </div>
      <figcaption className="border-t border-border px-5 py-4 text-start text-sm text-muted">
        صورة رئيسية / مكان الفيديو — أضف الفيديو أو استبدل الإطار بصورة من المعمل
      </figcaption>
    </figure>
  );
}
