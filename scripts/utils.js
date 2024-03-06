// @ts-check

import { mkdir, readFile, writeFile } from "fs/promises";
import { parse, resolve } from "path";
import { cwd } from "process";

/**
 * @param {import("fs").PathLike} path
 */
export async function readJSON(path) {
  const content = await readFile(path, { encoding: "utf-8" });
  return JSON.parse(content);
}

/**
 * @param {import("fs").PathLike} path
 * @param {any} json
 */
export async function writeJSON(path, json) {
  await writeFile(path, JSON.stringify(json, undefined, 2), { encoding: "utf-8" });
}

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
