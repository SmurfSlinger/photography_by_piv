/**
 * One-off marketing image sync from R2 (galleries prefix).
 * Uses .env credentials; does not use private gallery signed URLs.
 */
import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FILENAMES_PATH = path.join(ROOT, "marketing-image-filenames.txt");
const R2_LIST_PATH = path.join(ROOT, "r2-all-files.txt");
const ORIGINALS_DIR = path.join(ROOT, "public/images/marketing-originals");
const PREFIX = "galleries/";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function basename(key: string): string {
  return key.split("/").pop() ?? key;
}

async function listAllKeys(client: S3Client, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PREFIX,
        ContinuationToken: token,
      })
    );
    for (const item of res.Contents ?? []) {
      if (item.Key && !item.Key.endsWith("/")) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
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
  await mkdir(path.dirname(dest), { recursive: true });
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

  const approved = (await readFile(FILENAMES_PATH, "utf8"))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  console.log("Listing R2 galleries prefix…");
  const allKeys = await listAllKeys(client, bucket);
  await writeFile(R2_LIST_PATH, `${allKeys.join("\n")}\n`, "utf8");
  console.log(`Wrote ${allKeys.length} keys to r2-all-files.txt`);

  const byBasename = new Map<string, string[]>();
  for (const key of allKeys) {
    const name = basename(key);
    const list = byBasename.get(name) ?? [];
    list.push(key);
    byBasename.set(name, list);
  }

  await mkdir(ORIGINALS_DIR, { recursive: true });

  const notFound: string[] = [];
  const duplicates: { name: string; keys: string[] }[] = [];
  let copied = 0;

  for (const name of approved) {
    const matches = byBasename.get(name);
    if (!matches?.length) {
      notFound.push(name);
      console.log(`NOT FOUND: ${name}`);
      continue;
    }
    if (matches.length > 1) {
      duplicates.push({ name, keys: matches });
      console.log(`DUPLICATE (${matches.length}): ${name}`);
      for (const key of matches) console.log(`  ${key}`);
      continue;
    }
    const dest = path.join(ORIGINALS_DIR, name);
    await downloadKey(client, bucket, matches[0], dest);
    copied++;
    console.log(`COPIED: ${name} <- ${matches[0]}`);
  }

  const summary = {
    copied,
    notFound,
    duplicates: duplicates.map((d) => d.name),
  };
  console.log("\n--- Summary ---");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
