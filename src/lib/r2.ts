import "server-only";
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

function required(name: "R2_ACCOUNT_ID" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "R2_BUCKET") {
  const value = process.env[name];
  if (!value) throw new Error("missing-configuration");
  return value;
}

// Client settings match scripts/checks/r2-roundtrip.mjs.
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

export async function presignUpload(objectKey: string, contentType: string, byteSize: number) {
  const command = new PutObjectCommand({
    Bucket: required("R2_BUCKET"),
    Key: objectKey,
    ContentType: contentType,
    ContentLength: byteSize,
  });
  return getSignedUrl(storageClient(), command, { expiresIn: uploadSeconds });
}

export async function presignView(objectKey: string) {
  const command = new GetObjectCommand({
    Bucket: required("R2_BUCKET"),
    Key: objectKey,
  });
  return getSignedUrl(storageClient(), command, { expiresIn: viewSeconds });
}

export async function headObject(objectKey: string) {
  try {
    const head = await storageClient().send(
      new HeadObjectCommand({
        Bucket: required("R2_BUCKET"),
        Key: objectKey,
      }),
    );
    const size = head.ContentLength;
    const type = head.ContentType;
    if (typeof size !== "number" || typeof type !== "string") return null;
    return { size, type };
  } catch (error) {
    const status =
      error && typeof error === "object" && "$metadata" in error
        ? (error.$metadata as { httpStatusCode?: number }).httpStatusCode
        : 0;
    if (status === 404) return null;
    throw new Error("storage-failed");
  }
}

export async function deleteObject(objectKey: string) {
  await storageClient().send(
    new DeleteObjectCommand({
      Bucket: required("R2_BUCKET"),
      Key: objectKey,
    }),
  );
}
