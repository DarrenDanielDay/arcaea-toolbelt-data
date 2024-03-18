// @ts-check
/// <reference path="./all-types.d.ts" />

import { parse, resolve } from "path";
import { extractAPK } from "./apk.js";
import { readJSON, writeJSON } from "./utils.js";
import { cwd } from "process";

/**
 * @param {string} version
 */

export function apkName(version) {
  return `${extractName(version)}.apk`;
}

/**
 * @param {string} version
 */
export function extractName(version) {
  return `arcaea_${version}`;
}

/**
 * @param {string} version
 */
export function apkPaths(version) {
  const apkURL = new URL(`../arcaea/apk/${apkName(version)}`, import.meta.url);
  const extractURL = new URL(`../arcaea/${extractName(version)}`, import.meta.url);
  const slst = new URL(`../arcaea/${extractName(version)}/assets/songs/songlist`, import.meta.url);
  const pklst = new URL(`../arcaea/${extractName(version)}/assets/songs/packlist`, import.meta.url);
  return {
    apkURL,
    extractURL,
    slst,
    pklst,
  };
}

/**
 * @param {string} version
 */
export async function copyKeyFiles(version) {
  // metadata -> version -> songlist/packlist
  const copySubPaths = [
    `../arcaea/arcaea_${version}/assets/songs/songlist`,
    `../arcaea/arcaea_${version}/assets/songs/packlist`,
  ];
  const dataDir = resolve(cwd(), "src", "data");
  await Promise.all(
    copySubPaths.map(async (path) => {
      const url = new URL(path, import.meta.url);
      const json = await readJSON(url);
      // Not copy file, force to use LF.
      await writeJSON(resolve(dataDir, `${parse(path).base}.json`), json);
    })
  );
}

/**
 * @param {string} version
 */
export async function extractArcaeaAPK(version) {
  const { apkURL, extractURL } = apkPaths(version);
  await extractAPK(apkURL, extractURL);
}

/**
 * @param {string} version
 * @returns {Promise<SongList>}
 */
export async function getLocalSongList(version) {
  return readJSON(apkPaths(version).slst);
}

/**
 * @param {string} version
 * @returns {Promise<PackList>}
 */
export async function getLocalPackList(version) {
  return readJSON(apkPaths(version).pklst);
}
