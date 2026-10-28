import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { readJsonObject } from "@/lib/json-body";
import { encodedImageByteLimit, videoByteLimit, withinLimit } from "@/lib/media-limits";
import { resolveUploadName } from "@/lib/media-name";
import { mimeType } from "@/lib/object-key";
import { denyUnlessOperator, readOperatorGate, type OperatorGate } from "@/lib/operator-session";
import { presignUpload } from "@/lib/r2";

const nameLimit = 200;

async function codeKeys(gate: OperatorGate) {
  const { data, error } = await gate.supabase.from("CampaignOffer").select("code_key");
  const keys = new Set<string>();
  if (error || !Array.isArray(data)) return keys;
  for (const row of data) {
    if (!row || typeof row !== "object" || !("code_key" in row)) continue;
    const codeKey = row.code_key;
    if (typeof codeKey === "string") keys.add(codeKey);
  }
  return keys;
}

async function presign(request: Request, gate: OperatorGate) {
  const body = await readJsonObject(request);
  if (!body) return jsonCode(422, "rejected");
  const { name, type, size } = body;
  if (typeof name !== "string" || typeof type !== "string" || typeof size !== "number") {
    return jsonCode(422, "rejected");
  }
  if (name.length === 0 || name.length > nameLimit || type.length === 0 || type.length > 128) {
    return jsonCode(422, "rejected");
  }
  const resolved = resolveUploadName(name, await codeKeys(gate));
  if ("refusal" in resolved) return jsonCode(422, resolved.refusal);
  const mime = mimeType(type);
  const video = resolved.slot === "main_video";
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
    code: resolved.code,
    slot: resolved.slot,
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
