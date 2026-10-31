import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { discardUnrecorded, objectKeyState } from "@/lib/media-object-record";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-object-limits";
import { isObjectKey, mimeType } from "@/lib/object-key";
import { withOperator } from "@/lib/operator-route";
import { deleteObject, headObject } from "@/lib/r2";

export async function POST(request: Request) {
  return withOperator(async (gate) => {
    const body = await readJsonObject(request);
    if (!body) return jsonCode(422, "rejected");
    const { objectKey } = body;
    const webp = typeof objectKey === "string" && objectKey.endsWith(".webp");
    const mp4 = typeof objectKey === "string" && objectKey.endsWith(".mp4");
    if (typeof objectKey !== "string" || !isObjectKey(objectKey) || (!webp && !mp4)) {
      return jsonCode(422, "rejected");
    }
    try {
      const state = await objectKeyState(gate, objectKey);
      if (state === "recorded") return jsonCode(409, "already-recorded");
      if (state === "unknown") return jsonCode(422, "rejected");
      const head = await headObject(objectKey);
      const type = head ? mimeType(head.type) : "";
      const size = head ? head.size : 0;
      const expectedType = webp ? "image/webp" : "video/mp4";
      const limit = webp ? encodedImageByteLimit : videoByteLimit;
      if (!head || type !== expectedType || !withinLimit(size, limit)) {
        await discardUnrecorded(gate, objectKey);
        return jsonCode(422, "mismatch");
      }
      const { data, error } = await gate.supabase.rpc("attach_campaign_banner", {
        p_object_key: objectKey,
        p_content_type: type,
        p_byte_size: size,
      });
      if (error) {
        await discardUnrecorded(gate, objectKey);
        return jsonCode(422, "rejected");
      }
      if (typeof data === "string" && data.length > 0 && data !== objectKey) await deleteObject(data);
      return NextResponse.json({ replaced: typeof data === "string" && data.length > 0 });
    } catch {
      await discardUnrecorded(gate, objectKey);
      return jsonCode(422, "rejected");
    }
  });
}
