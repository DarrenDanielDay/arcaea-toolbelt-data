// @ts-check
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { createHmac } from "crypto";
import { parse, resolve } from "path";
import { argv, cwd } from "process";

/**
 * @param {string} filename
 */
async function hashFile(filename) {
  const hmac = createHmac("sha256", "arcaea-toolbelt-data");
  const text = await readFile(filename, { encoding: "utf-8" });
  return hmac.update(text).digest("hex");
}

const root = cwd();
const dataDir = resolve(root, "src", "data");

/**
 * @param {string} path
 */
async function readJSON(path) {
  const content = await readFile(path, { encoding: "utf-8" });
  return JSON.parse(content);
}

async function generateIndex() {
  const meta = "meta.json";
  const metaFile = resolve(dataDir, meta);
  /** @type {import('@arcaea-toolbelt/models/misc').ArcaeaToolbeltMeta} */
  const metadata = await readJSON(metaFile);
  const version = metadata.version;
  // metadata -> version -> songlist/packlist
  const copySubPaths = [
    `../arcaea/arcaea_${version}/assets/songs/songlist`,
    `../arcaea/arcaea_${version}/assets/songs/packlist`,
  ];
  await Promise.all(
    copySubPaths.map(async (path) => {
      const url = new URL(path, import.meta.url);
      await copyFile(url, resolve(dataDir, `${parse(path).base}.json`));
    })
  );
  const files = (await readdir(dataDir)).filter((file) => file !== meta);
  const index = await Promise.all(
    files.map(async (file) => {
      const hash = await hashFile(resolve(dataDir, file));
      /** @type {import('@arcaea-toolbelt/models/misc').ArcaeaToolbeltMeta['index'][number]} */
      const item = { file, hash: hash.slice(0, 8) };
      return item;
    })
  );
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
  if (argv.includes("--generate")) {
    await generateIndex();
  }
  await buildStatic();
}

await main();
