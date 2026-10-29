import {
  encodedImageByteLimit,
  imageLongestEdge,
  selectedImageByteLimit,
} from "@/lib/media-object-limits";

export type ReencodeRefusal = "too-large" | "unreadable" | "wrong-type" | "encoded-too-large";

export async function reencodeImage(source: Blob): Promise<{ blob: Blob } | { refusal: ReencodeRefusal }> {
  if (source.size > selectedImageByteLimit) return { refusal: "too-large" };
  if (source.size <= 0) return { refusal: "unreadable" };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    return { refusal: "unreadable" };
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > imageLongestEdge ? imageLongestEdge / longest : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return { refusal: "unreadable" };
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const qualities = [0.9, 0.8, 0.6, 0.4];
  let encoded: Blob | null = null;
  for (const quality of qualities) {
    encoded = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
    });
    if (!encoded) return { refusal: "unreadable" };
    if (encoded.type !== "image/webp") return { refusal: "wrong-type" };
    if (encoded.size <= encodedImageByteLimit) return { blob: encoded };
  }
  return { refusal: "encoded-too-large" };
}
