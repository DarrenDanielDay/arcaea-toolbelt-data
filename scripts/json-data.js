// @ts-check
import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { createHmac } from "crypto";
import { parse, resolve } from "path";
import { argv, cwd } from "process";
import { patchJSON, readJSON } from "./utils.js";
import { fileURLToPath } from "url";
import { metaFile } from "./files.js";

/**
 * @param {string} filename
 */
async function hashFile(filename) {
  const hmac = createHmac("sha256", "arcaea-toolbelt-data");
  const buffer = await readFile(filename);
  return hmac.update(buffer).digest("hex");
}

const root = cwd();
const dataDir = resolve(root, "src", "data");

export async function generateIndex() {
  const meta = "meta.json";
  patchJSON(metaFile, async (metadata) => {
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
  });
}

export async function buildStatic() {
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

if (process.argv.some((arg) => arg.includes(parse(fileURLToPath(import.meta.url)).base))) {
  await main();
}
