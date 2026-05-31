import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGINALS_DIR = path.join(ROOT, "public/images/marketing-originals");

const COPIES: { filename: string; key: string }[] = [
  {
    filename: "IMG_7652.jpg",
    key: "galleries/mason-and-dallin/IMG_7652.jpg",
  },
  {
    filename: "B44A1185.jpg",
    key: "galleries/cooper-and-mallory-formals/B44A1185.jpg",
  },
];

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
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
  for (const { filename, key } of COPIES) {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!res.Body || !(res.Body instanceof Readable)) {
      throw new Error(`Failed: ${key}`);
    }
    await pipeline(
      res.Body,
      createWriteStream(path.join(ORIGINALS_DIR, filename))
    );
    console.log(`COPIED ${filename}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
