import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-object-limits";
import { mimeType } from "@/lib/object-key";
import { withOperator } from "@/lib/operator-route";
import { presignUpload } from "@/lib/r2";

export async function POST(request: Request) {
  return withOperator(async (gate) => {
    if (gate.status !== "ok") return jsonCode(403, "forbidden");
    const body = await readJsonObject(request);
    if (!body) return jsonCode(422, "rejected");
    const { type, size } = body;
    if (typeof type !== "string" || typeof size !== "number") return jsonCode(422, "rejected");
    const mime = mimeType(type);
    const image = mime === "image/webp" && withinLimit(size, encodedImageByteLimit);
    const video = mime === "video/mp4" && withinLimit(size, videoByteLimit);
    if (!image && !video) return jsonCode(422, "rejected");
    try {
      const objectKey = `media/${crypto.randomUUID()}.${image ? "webp" : "mp4"}`;
      const uploadUrl = await presignUpload(objectKey, mime, size);
      return NextResponse.json({ objectKey, uploadUrl });
    } catch {
      return jsonCode(422, "rejected");
    }
  });
}
