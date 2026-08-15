import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { isAllowedR2Key } from "@/lib/gallery-keys";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function getDisplayUrlTtl(): number {
  const raw = process.env.SIGNED_URL_TTL_THUMB_WEB;
  return raw ? Number.parseInt(raw, 10) : 900;
}

export function getDownloadUrlTtl(): number {
  const raw = process.env.SIGNED_URL_TTL_ORIGINAL;
  return raw ? Number.parseInt(raw, 10) : 60;
}

export async function presignGet(
  key: string,
  slug: string,
  ttlSeconds: number
): Promise<string> {
  if (!isAllowedR2Key(key, slug)) {
    throw new Error("Invalid R2 object key for gallery");
  }

  const command = new GetObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: ttlSeconds });
}

export async function putGalleryObject(options: {
  key: string;
  slug: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  if (!isAllowedR2Key(options.key, options.slug)) {
    throw new Error("Invalid R2 object key for gallery");
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      CacheControl: "private, max-age=31536000",
    })
  );
}

export async function deleteGalleryObject(options: {
  key: string;
  slug: string;
}): Promise<void> {
  if (!isAllowedR2Key(options.key, options.slug)) {
    throw new Error("Invalid R2 object key for gallery");
  }

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: options.key,
    })
  );
}
