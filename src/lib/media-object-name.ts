export const uploadSlots = [
  "main_video",
  "main_image",
  "gallery_1",
  "gallery_2",
  "gallery_3",
] as const;

export type UploadSlot = (typeof uploadSlots)[number];

export type UploadRefusal = "ambiguous" | "unknown-code" | "video-in-gallery" | "bad-extension";

export type UploadName = { code: string; slot: UploadSlot } | { refusal: UploadRefusal };

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export function isUploadSlot(value: string): value is UploadSlot {
  return (uploadSlots as readonly string[]).includes(value);
}

function gallerySlot(index: string): UploadSlot | null {
  if (index === "1") return "gallery_1";
  if (index === "2") return "gallery_2";
  if (index === "3") return "gallery_3";
  return null;
}

export function resolveUploadName(name: string, codeKeys: ReadonlySet<string>): UploadName {
  const slash = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  const leaf = slash >= 0 ? name.slice(slash + 1) : name;
  const dot = leaf.lastIndexOf(".");
  if (dot <= 0 || dot === leaf.length - 1) return { refusal: "bad-extension" };
  const extension = leaf.slice(dot + 1).toLowerCase();
  const stem = leaf.slice(0, dot);
  const image = imageExtensions.has(extension);
  const video = extension === "mp4";
  if (!image && !video) return { refusal: "bad-extension" };
  const keys = new Set(Array.from(codeKeys, (codeKey) => codeKey.toUpperCase()));
  const stemKey = stem.toUpperCase();
  const exact = keys.has(stemKey);
  const gallery = /^(.+)-([123])$/.exec(stemKey);
  const galleryKey = gallery?.[1] ?? "";
  const galleryHit = galleryKey.length > 0 && keys.has(galleryKey);
  if (exact && galleryHit) return { refusal: "ambiguous" };
  if (!exact && galleryHit && video) return { refusal: "video-in-gallery" };
  if (exact && video) return { code: stemKey, slot: "main_video" };
  if (exact && image) return { code: stemKey, slot: "main_image" };
  if (galleryHit && image) {
    const slot = gallerySlot(gallery?.[2] ?? "");
    if (!slot) return { refusal: "unknown-code" };
    return { code: galleryKey, slot };
  }
  return { refusal: "unknown-code" };
}
