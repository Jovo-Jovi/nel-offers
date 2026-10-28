import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const uploadSeconds = 10 * 60;
const viewSeconds = 60 * 60;
const payload = Buffer.alloc(16, 7);

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error("missing-configuration");
    process.exit(1);
  }
  return value;
}

function storageStatus(error) {
  if (!error || typeof error !== "object" || !("$metadata" in error)) return 0;
  const status = error.$metadata.httpStatusCode;
  return typeof status === "number" ? status : 0;
}

function checksumLike(error, detail) {
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  const code = error && typeof error === "object" && "Code" in error ? String(error.Code) : "";
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  const blob = `${name} ${code} ${message} ${detail ?? ""}`.toLowerCase();
  return blob.includes("checksum") || blob.includes("signature");
}

// Client settings match src/lib/r2.ts.
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

const bucket = required("R2_BUCKET");
const objectKey = `media/${randomUUID()}.webp`;
const client = storageClient();
let failed = false;

function mark(step, error, detail) {
  failed = true;
  console.error(checksumLike(error, detail) ? `${step} checksum-or-signature` : `${step} failed`);
}

try {
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: "image/webp",
      ContentLength: payload.length,
    }),
    { expiresIn: uploadSeconds },
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "image/webp" },
    body: payload,
  });
  console.log(`PUT ${put.status}`);
  if (put.status !== 200) {
    const detail = await put.text();
    mark("PUT", null, detail);
  } else {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    const headStatus = head.$metadata.httpStatusCode ?? 0;
    console.log(`HEAD ${headStatus} ${head.ContentLength} ${head.ContentType}`);
    if (headStatus !== 200 || head.ContentLength !== payload.length || head.ContentType !== "image/webp") {
      mark("HEAD", null, "");
    }
    const viewUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
      { expiresIn: viewSeconds },
    );
    const got = await fetch(viewUrl);
    const bytes = Buffer.from(await got.arrayBuffer());
    const equal = bytes.length === payload.length && bytes.equals(payload);
    console.log(`GET ${got.status} ${bytes.length} ${equal ? "equal" : "differ"}`);
    if (got.status !== 200 || !equal) mark("GET", null, "");
    const removed = await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    const deleteStatus = removed.$metadata.httpStatusCode ?? 0;
    console.log(`DELETE ${deleteStatus}`);
    if (deleteStatus !== 200 && deleteStatus !== 204) mark("DELETE", null, "");
    try {
      const again = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
      console.log(`HEAD ${again.$metadata.httpStatusCode ?? 0}`);
      mark("HEAD", null, "");
    } catch (error) {
      const status = storageStatus(error);
      console.log(`HEAD ${status}`);
      if (status !== 404) mark("HEAD", error, "");
    }
  }
} catch (error) {
  mark("ROUND", error, "");
} finally {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch {
    // A failed run must not leave the synthetic object behind.
  }
}

if (failed) process.exit(1);
