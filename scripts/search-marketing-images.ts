/**
 * Full-bucket R2 search for approved marketing filenames.
 * Lists only — copies only unique exact or obvious fuzzy matches.
 */
import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUCKET_LIST_PATH = path.join(ROOT, "r2-all-bucket-files.txt");
const ORIGINALS_DIR = path.join(ROOT, "public/images/marketing");
const ORIGINALS_SRC_DIR = path.join(ROOT, "public/images/marketing-originals");
const REPORT_PATH = path.join(ROOT, "marketing-image-search-report.json");

const MISSING = [
  "B44A1337.jpg",
  "B44A1185.jpg",
  "B44A6929.jpg",
  "IMG_7652.jpg",
  "B44A5589.jpg",
  "IMG_4102.jpg",
  "IMG_3610.jpg",
  "B44A0050-Edit.jpg",
  "B44A2032.jpg",
  "B44A1940.jpg",
  "IMG_4503.jpg",
  "B44A7012-2.jpg",
  "B44A6138-Edit.jpg",
] as const;

const DUPLICATE_PHOTOS = [
  "photograhybypiv-9.jpg",
  "photograhybypiv-22.jpg",
  "photograhybypiv-157.jpg",
  "photograhybypiv-168.jpg",
  "photograhybypiv-2.jpg",
  "photograhybypiv-10.jpg",
  "photograhybypiv-92.jpg",
] as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function basename(key: string): string {
  return key.split("/").pop() ?? key;
}

function parentFolder(key: string): string {
  const parts = key.split("/");
  return parts.length >= 2 ? parts[parts.length - 2] : "(root)";
}

function splitName(filename: string): { stem: string; ext: string } {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return { stem: filename, ext: "" };
  return { stem: filename.slice(0, dot), ext: filename.slice(dot + 1) };
}

function normalizeStem(stem: string): string {
  return stem.toLowerCase();
}

function normalizeExt(ext: string): string {
  return ext.toLowerCase();
}

function isImageKey(key: string): boolean {
  const { ext } = splitName(basename(key));
  const e = normalizeExt(ext);
  return e === "jpg" || e === "jpeg" || e === "png" || e === "webp";
}

function fuzzyVariants(requested: string): string[] {
  const { stem, ext } = splitName(requested);
  const variants = new Set<string>();
  const add = (s: string) => variants.add(`${s}.${ext || "jpg"}`);

  add(stem);
  add(stem.replace(/-edit$/i, ""));
  add(stem.replace(/-2$/i, ""));

  const b44 = stem.match(/^B44A(\d+)$/i);
  if (b44) add(`B44A${b44[1]}`);

  const img = stem.match(/^IMG[_-]?(\d+)$/i);
  if (img) {
    add(`IMG_${img[1]}`);
    add(`IMG${img[1]}`);
    add(img[1]);
  }

  return [...variants].map((v) => normalizeStem(splitName(v).stem));
}

async function listEntireBucket(
  client: S3Client,
  bucket: string
): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      })
    );
    for (const item of res.Contents ?? []) {
      if (item.Key && !item.Key.endsWith("/") && isImageKey(item.Key)) {
        keys.push(item.Key);
      }
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

type MatchResult = {
  requested: string;
  exact: string[];
  fuzzy: { key: string; reason: string }[];
  stillMissing: boolean;
  autoCopied?: { from: string; destName: string };
};

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

  console.log("Listing entire bucket (metadata only)…");
  const allKeys = await listEntireBucket(client, bucket);
  await writeFile(BUCKET_LIST_PATH, `${allKeys.join("\n")}\n`, "utf8");
  console.log(`Wrote ${allKeys.length} image keys to r2-all-bucket-files.txt`);

  const byExactBasename = new Map<string, string[]>();
  const entries = allKeys.map((key) => {
    const name = basename(key);
    const { stem, ext } = splitName(name);
    const normStem = normalizeStem(stem);
    const normExt = normalizeExt(ext);
    const list = byExactBasename.get(name) ?? [];
    list.push(key);
    byExactBasename.set(name, list);
    return { key, name, normStem, normExt, parent: parentFolder(key) };
  });

  const exactMatches: Record<string, string[]> = {};
  const fuzzyMatches: Record<string, { key: string; reason: string }[]> = {};
  const stillMissing: string[] = [];
  const autoMappings: { requested: string; from: string; destName: string }[] =
    [];

  await mkdir(ORIGINALS_SRC_DIR, { recursive: true });
  await mkdir(ORIGINALS_DIR, { recursive: true });

  for (const requested of MISSING) {
    const exact = byExactBasename.get(requested) ?? [];
    if (exact.length === 1) {
      exactMatches[requested] = exact;
      const dest = path.join(ORIGINALS_SRC_DIR, requested);
      await downloadKey(client, bucket, exact[0], dest);
      autoMappings.push({
        requested,
        from: exact[0],
        destName: requested,
      });
      console.log(`EXACT COPY: ${requested} <- ${exact[0]}`);
      continue;
    }
    if (exact.length > 1) {
      exactMatches[requested] = exact;
      console.log(`EXACT DUPLICATE (${exact.length}): ${requested}`);
      for (const k of exact) console.log(`  ${k}`);
      continue;
    }

    const reqStem = normalizeStem(splitName(requested).stem);
    const variantStems = new Set(fuzzyVariants(requested));

    const candidates: { key: string; reason: string }[] = [];
    for (const e of entries) {
      if (e.normStem === reqStem) {
        candidates.push({ key: e.key, reason: "case-insensitive stem match" });
        continue;
      }
      if (variantStems.has(e.normStem)) {
        candidates.push({ key: e.key, reason: "variant stem match" });
        continue;
      }
      if (reqStem.startsWith("img") || reqStem.startsWith("b44a")) {
        const num = reqStem.replace(/^img[_-]?/i, "").replace(/^b44a/i, "");
        if (num && e.normStem.endsWith(num) && e.normStem.includes(num)) {
          const b44Only = e.normStem.match(/^b44a\d+$/);
          const imgOnly = e.normStem.match(/^img[_-]?\d+$/);
          if (b44Only || imgOnly) {
            candidates.push({ key: e.key, reason: `numeric pattern (${num})` });
          }
        }
      }
    }

    const uniqueKeys = [...new Map(candidates.map((c) => [c.key, c])).values()];

    if (uniqueKeys.length === 1) {
      fuzzyMatches[requested] = uniqueKeys;
      const destName = requested;
      await downloadKey(client, bucket, uniqueKeys[0].key, path.join(ORIGINALS_SRC_DIR, destName));
      autoMappings.push({
        requested,
        from: uniqueKeys[0].key,
        destName,
      });
      console.log(
        `FUZZY AUTO-COPY: ${requested} <- ${uniqueKeys[0].key} (${uniqueKeys[0].reason})`
      );
    } else if (uniqueKeys.length > 1) {
      fuzzyMatches[requested] = uniqueKeys;
      console.log(`FUZZY MULTIPLE (${uniqueKeys.length}): ${requested}`);
      for (const c of uniqueKeys) console.log(`  ${c.key} — ${c.reason}`);
    } else {
      stillMissing.push(requested);
      console.log(`STILL MISSING: ${requested}`);
    }
  }

  const duplicateReport: Record<
    string,
    { keys: string[]; parents: string[] }
  > = {};

  for (const name of DUPLICATE_PHOTOS) {
    const keys = byExactBasename.get(name) ?? [];
    duplicateReport[name] = {
      keys,
      parents: keys.map(parentFolder),
    };
    console.log(`\nDUPLICATE REPORT: ${name} (${keys.length})`);
    for (const key of keys) {
      console.log(`  ${parentFolder(key)} → ${key}`);
    }
  }

  const report = {
    bucketImageCount: allKeys.length,
    exactMatches,
    fuzzyMatches,
    stillMissing,
    autoMappings,
    duplicateReport,
  };
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nWrote ${REPORT_PATH}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
