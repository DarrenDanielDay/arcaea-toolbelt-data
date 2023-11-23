import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { createHmac } from "crypto";
import { resolve } from "path";
import { cwd } from "process";

async function hashFile(filename) {
  const hmac = createHmac("sha256", "arcaea-toolbelt-data");
  const text = await readFile(filename, { encoding: "utf-8" });
  return hmac.update(text).digest("hex");
}

const root = cwd();
const dataDir = resolve(root, "src", "data");

async function readJSON(path) {
  const content = await readFile(path, { encoding: "utf-8" });
  return JSON.parse(content);
}

async function generateIndex() {
  const meta = "meta.json";
  const files = (await readdir(dataDir)).filter((file) => file !== meta);
  const index = await Promise.all(
    files.map(async (file) => {
      const hash = await hashFile(resolve(dataDir, file));
      return { file, hash: hash.slice(0, 8) };
    })
  );
  const metaFile = resolve(dataDir, meta);
  const metadata = await readJSON(metaFile);
  metadata.index = index;
  await writeFile(metaFile, JSON.stringify(metadata, undefined, 2), {
    encoding: "utf-8",
  });
}

async function buildStatic() {
  const dist = resolve(root, "dist");
  try {
    await stat(dist);
  } catch (error) {
    await mkdir(dist);
  }
  // copy and minify json
  const files = await readdir(dataDir);
  await Promise.all(
    files.map(async (file) => {
      const content = await readJSON(resolve(dataDir, file));
      const minified = JSON.stringify(content);
      await writeFile(resolve(dist, file), minified, {
        encoding: "utf-8",
      });
    })
  );
}

async function main() {
  await generateIndex();
  await buildStatic();
}

await main();
