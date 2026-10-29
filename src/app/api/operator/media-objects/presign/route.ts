import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-object-limits";
import { isUploadSlot } from "@/lib/media-object-name";
import { mimeType } from "@/lib/object-key";
import { denyUnlessOperator, readOperatorGate, type OperatorGate } from "@/lib/operator-session";
import { presignUpload } from "@/lib/r2";

const codePattern = /^[A-Za-z0-9-]{2,20}$/;

async function knownCode(gate: OperatorGate, code: string) {
  const { data, error } = await gate.supabase.from("CampaignOffer").select("code_key").eq("code_key", code);
  if (error || !Array.isArray(data)) return false;
  return data.some((row) => row && typeof row === "object" && "code_key" in row && row.code_key === code);
}

async function presign(request: Request, gate: OperatorGate) {
  const body = await readJsonObject(request);
  if (!body || Object.prototype.hasOwnProperty.call(body, "name")) return jsonCode(422, "rejected");
  const { code, slot, type, size } = body;
  if (typeof code !== "string" || typeof slot !== "string" || typeof type !== "string" || typeof size !== "number") {
    return jsonCode(422, "rejected");
  }
  if (!codePattern.test(code) || !isUploadSlot(slot) || type.length === 0 || type.length > 128) {
    return jsonCode(422, "rejected");
  }
  const codeKey = code.toUpperCase();
  if (!(await knownCode(gate, codeKey))) return jsonCode(422, "rejected");
  const mime = mimeType(type);
  const video = slot === "main_video";
  if (video) {
    if (mime !== "video/mp4" || !withinLimit(size, videoByteLimit)) return jsonCode(422, "rejected");
  } else if (mime !== "image/webp" || !withinLimit(size, encodedImageByteLimit)) {
    return jsonCode(422, "rejected");
  }
  const objectKey = `media/${crypto.randomUUID()}.${video ? "mp4" : "webp"}`;
  const uploadUrl = await presignUpload(objectKey, mime, size);
  return NextResponse.json({
    objectKey,
    uploadUrl,
    code: codeKey,
    slot,
  });
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
  try {
    return await presign(request, gate);
  } catch {
    return jsonCode(422, "rejected");
  }
}
