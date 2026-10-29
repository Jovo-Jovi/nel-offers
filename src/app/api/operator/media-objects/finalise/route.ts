import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { discardUnrecorded, objectKeyState } from "@/lib/media-object-record";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-object-limits";
import { isUploadSlot } from "@/lib/media-object-name";
import { isObjectKey, mimeType } from "@/lib/object-key";
import { type OperatorGate } from "@/lib/operator-session";
import { withOperator } from "@/lib/operator-route";
import { deleteObject, headObject } from "@/lib/r2";

function slotFits(slot: string, objectKey: string, type: string, size: number) {
  if (slot === "main_video") {
    return objectKey.endsWith(".mp4") && type === "video/mp4" && withinLimit(size, videoByteLimit);
  }
  return objectKey.endsWith(".webp") && type === "image/webp" && withinLimit(size, encodedImageByteLimit);
}

async function finalise(body: Record<string, unknown>, gate: OperatorGate) {
  const { objectKey, code, slot } = body;
  if (typeof objectKey !== "string" || typeof code !== "string" || typeof slot !== "string") {
    return jsonCode(422, "rejected");
  }
  if (!isObjectKey(objectKey) || !isUploadSlot(slot) || !/^[A-Za-z0-9-]{2,20}$/.test(code)) {
    return jsonCode(422, "rejected");
  }
  const state = await objectKeyState(gate, objectKey);
  if (state === "recorded") return jsonCode(409, "already-recorded");
  if (state === "unknown") return jsonCode(422, "rejected");
  const head = await headObject(objectKey);
  const type = head ? mimeType(head.type) : "";
  const size = head ? head.size : 0;
  if (!head || !slotFits(slot, objectKey, type, size)) {
    await discardUnrecorded(gate, objectKey);
    return jsonCode(422, "mismatch");
  }
  const { data, error } = await gate.supabase.rpc("attach_media_object", {
    p_code: code,
    p_slot: slot,
    p_object_key: objectKey,
    p_kind: slot === "main_video" ? "video" : "image",
    p_content_type: type,
    p_byte_size: size,
  });
  if (error) {
    await discardUnrecorded(gate, objectKey);
    return jsonCode(422, "rejected");
  }
  if (typeof data === "string" && data.length > 0 && data !== objectKey) {
    await deleteObject(data);
    return NextResponse.json({ replaced: true });
  }
  return NextResponse.json({ replaced: false });
}

export async function POST(request: Request) {
  return withOperator(async (gate) => {
    const body = await readJsonObject(request);
    if (!body) return jsonCode(422, "rejected");
    try {
      return await finalise(body, gate);
    } catch {
      const objectKey = body.objectKey;
      if (typeof objectKey === "string" && isObjectKey(objectKey)) {
        await discardUnrecorded(gate, objectKey);
      }
      return jsonCode(422, "rejected");
    }
  });
}
