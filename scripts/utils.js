// @ts-check

import { mkdir, writeFile } from "fs/promises";
import { parse, resolve } from "path";
import { cwd } from "process";

/**
 *
 * @param {string} subpath
 * @param {Uint8Array | string} content
 */
export async function output(subpath, content) {
  const dist = resolve(cwd(), "outputs", subpath);
  const dir = parse(dist).dir;
  await mkdir(dir, { recursive: true });
  await writeFile(dist, content, { encoding: "utf8" });
}
