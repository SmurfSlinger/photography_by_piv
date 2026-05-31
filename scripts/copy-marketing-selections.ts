import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGINALS_DIR = path.join(ROOT, "public/images/marketing-originals");

const SELECTIONS: { filename: string; key: string }[] = [
  {
    filename: "photograhybypiv-9.jpg",
    key: "galleries/sophie-graduation-photos/photograhybypiv-9.jpg",
  },
  {
    filename: "photograhybypiv-22.jpg",
    key: "galleries/sophie-graduation-photos/photograhybypiv-22.jpg",
  },
  {
    filename: "photograhybypiv-157.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-157.jpg",
  },
  {
    filename: "photograhybypiv-168.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-168.jpg",
  },
  {
    filename: "photograhybypiv-2.jpg",
    key: "galleries/brayden-graduation/photograhybypiv-2.jpg",
  },
  {
    filename: "photograhybypiv-10.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-10.jpg",
  },
  {
    filename: "photograhybypiv-92.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-92.jpg",
  },
  {
    filename: "photograhybypiv-94.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-94.jpg",
  },
  {
    filename: "photograhybypiv-90.jpg",
    key: "galleries/courtnee-and-dallin-engagements/photograhybypiv-90.jpg",
  },
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function downloadKey(
  client: S3Client,
  bucket: string,
  key: string,
  dest: string
): Promise<void> {
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  if (!res.Body) throw new Error(`Empty body for ${key}`);
  const body = res.Body;
  if (!(body instanceof Readable)) {
    throw new Error(`Unexpected response body type for ${key}`);
  }
  await pipeline(body, createWriteStream(dest));
}

async function main(): Promise<void> {
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  await mkdir(ORIGINALS_DIR, { recursive: true });

  for (const { filename, key } of SELECTIONS) {
    const dest = path.join(ORIGINALS_DIR, filename);
    await downloadKey(client, bucket, key, dest);
    console.log(`COPIED: ${filename} <- ${key}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
