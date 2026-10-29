import { createHmac } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const xyz = Uint8Array.from([0xa9, 0x78, 0x79, 0x7a]);
const locationKey = Buffer.from("com.apple.quicktime.location");
const prefix = "media/";

function fail() {
  console.error("scan-failed");
  process.exit(1);
}

function required(name) {
  const value = process.env[name];
  if (!value) fail();
  return value;
}

function decodeBase32(value) {
  const cleaned = value.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = "";
  for (const char of cleaned) {
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function currentCode(secret, at = Date.now()) {
  const key = decodeBase32(secret);
  const counter = Math.floor(at / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    (digest[offset] & 0x7f) * 2 ** 24 +
    digest[offset + 1] * 2 ** 16 +
    digest[offset + 2] * 2 ** 8 +
    digest[offset + 3];
  return String(binary % 10 ** 6).padStart(6, "0");
}

function containsBytes(haystack, needle) {
  if (needle.length === 0 || haystack.length < needle.length) return false;
  const last = haystack.length - needle.length;
  for (let index = 0; index <= last; index += 1) {
    let matched = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

function locationHit(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const total = bytes.length;
  let offset = 0;
  let moov = null;
  while (offset + 8 <= total) {
    let size = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > total) return false;
      const high = view.getUint32(offset + 8);
      const low = view.getUint32(offset + 12);
      if (high > 0) return false;
      size = low;
      headerSize = 16;
    }
    if (size === 0) size = total - offset;
    if (size < headerSize || offset + size > total) return false;
    if (type === "moov") moov = bytes.subarray(offset + headerSize, offset + size);
    offset += size;
  }
  if (!moov) return false;
  return containsBytes(moov, xyz) || containsBytes(moov, locationKey);
}

function metadataHit(bytes) {
  const text = Buffer.from(bytes).toString("latin1");
  return text.includes("EXIF") || text.includes("XMP ");
}

function storageClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function listedObjects(client, bucket) {
  const found = [];
  let token;
  do {
    const batch = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    for (const entry of batch.Contents ?? []) {
      if (!entry.Key || entry.Key.endsWith("/")) continue;
      found.push({ key: entry.Key, modified: entry.LastModified ?? null });
    }
    token = batch.IsTruncated ? batch.NextContinuationToken : undefined;
  } while (token);
  return found;
}

async function readBytes(client, bucket, key) {
  const got = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!got.Body) return new Uint8Array();
  return new Uint8Array(await got.Body.transformToByteArray());
}

async function operatorClient() {
  const supabase = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const signed = await supabase.auth.signInWithPassword({
    email: required("E2E_OPERATOR_EMAIL"),
    password: required("E2E_OPERATOR_PASSWORD"),
  });
  if (signed.error) fail();
  const factors = await supabase.auth.mfa.listFactors();
  const factor = factors.data?.totp?.[0];
  if (!factor) fail();
  const secret = required("E2E_OPERATOR_TOTP_SECRET");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remain = 30 - (Math.floor(Date.now() / 1000) % 30);
    if (remain < 5) await new Promise((resolve) => setTimeout(resolve, (remain + 1) * 1000));
    const challenged = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenged.error || !challenged.data) continue;
    const verified = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenged.data.id,
      code: currentCode(secret),
    });
    if (!verified.error) return supabase;
  }
  fail();
}

const bucket = required("R2_BUCKET");
const client = storageClient();
const objects = await listedObjects(client, bucket);
let metadata = 0;
let location = 0;
for (const entry of objects) {
  const bytes = await readBytes(client, bucket, entry.key);
  if (entry.key.endsWith(".webp") && metadataHit(bytes)) metadata += 1;
  if (entry.key.endsWith(".mp4") && locationHit(bytes)) location += 1;
}

const supabase = await operatorClient();
const rows = await supabase.from("MediaObject").select("object_key");
if (rows.error || !Array.isArray(rows.data)) fail();
const recorded = new Set();
for (const row of rows.data) {
  if (row && typeof row.object_key === "string") recorded.add(row.object_key);
}
const present = new Set(objects.map((entry) => entry.key));
let missingRow = 0;
for (const key of present) if (!recorded.has(key)) missingRow += 1;
let missingObject = 0;
for (const key of recorded) if (!present.has(key)) missingObject += 1;

console.log(
  `SCAN objects=${objects.length} metadata=${metadata} location=${location} no-row=${missingRow} no-object=${missingObject}`,
);

if (process.argv.includes("--remove-unrecorded")) {
  const cutoff = Date.now() - 15 * 60 * 1000;
  let removed = 0;
  for (const entry of objects) {
    if (recorded.has(entry.key) || !entry.modified || entry.modified.getTime() > cutoff) continue;
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: entry.key }));
    removed += 1;
  }
  console.log(`REMOVED ${removed}`);
}
