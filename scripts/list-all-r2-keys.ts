import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function main() {
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
    );
    for (const item of res.Contents ?? []) {
      if (item.Key && !item.Key.endsWith("/")) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  await writeFile(path.join(ROOT, "r2-all-bucket-files.txt"), `${keys.join("\n")}\n`);
  console.log(`Total objects: ${keys.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
