import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-limits";
import { isUploadSlot } from "@/lib/media-name";
import { isObjectKey, mimeType } from "@/lib/object-key";
import { denyUnlessOperator, readOperatorGate, type OperatorGate } from "@/lib/operator-session";
import { deleteObject, headObject } from "@/lib/r2";

function slotFits(slot: string, objectKey: string, type: string, size: number) {
  if (slot === "main_video") {
    return (
      objectKey.endsWith(".mp4") &&
      type === "video/mp4" &&
      withinLimit(size, videoByteLimit)
    );
  }
  return (
    objectKey.endsWith(".webp") &&
    type === "image/webp" &&
    withinLimit(size, encodedImageByteLimit)
  );
}

async function finalise(body: Record<string, unknown>, gate: OperatorGate) {
  const { objectKey, code, slot } = body;
  if (typeof objectKey !== "string" || typeof code !== "string" || typeof slot !== "string") {
    return jsonCode(422, "rejected");
  }
  if (!isObjectKey(objectKey) || !isUploadSlot(slot) || !/^[A-Za-z0-9-]{2,20}$/.test(code)) {
    return jsonCode(422, "rejected");
  }
  const head = await headObject(objectKey);
  const type = head ? mimeType(head.type) : "";
  const size = head ? head.size : 0;
  if (!head || !slotFits(slot, objectKey, type, size)) {
    await deleteObject(objectKey);
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
    await deleteObject(objectKey);
    return jsonCode(422, "rejected");
  }
  if (typeof data === "string" && data.length > 0) {
    if (data !== objectKey) await deleteObject(data);
    return NextResponse.json({ replaced: true });
  }
  return NextResponse.json({ replaced: false });
}

export async function POST(request: Request) {
  let gate: OperatorGate;
  try {
    gate = await readOperatorGate();
  } catch {
    return jsonCode(401, "no-session");
  }
  const denied = denyUnlessOperator(gate);
  if (denied) return denied;
  const body = await readJsonObject(request);
  if (!body) return jsonCode(422, "rejected");
  try {
    return await finalise(body, gate);
  } catch {
    const objectKey = body.objectKey;
    if (typeof objectKey === "string" && isObjectKey(objectKey)) {
      try {
        await deleteObject(objectKey);
      } catch {
        // The response stays a short code when storage cleanup fails.
      }
    }
    return jsonCode(422, "rejected");
  }
}
