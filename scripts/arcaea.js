// @ts-check
/// <reference path="./all-types.d.ts" />

import { parse, resolve } from "path";
import { extractAPK } from "./apk.js";
import { patchDeep, readJSON, writeJSON } from "./utils.js";
import { cwd } from "process";
import { metaFile } from "./files.js";

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

export async function getVersionFromMeta() {
  const meta = await metaFile();
  return meta.version;
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
    `../arcaea/${extractName(version)}/assets/songs/songlist`,
    `../arcaea/${extractName(version)}/assets/songs/packlist`,
  ];
  const dataDir = resolve(cwd(), "src", "data");
  await Promise.all(
    copySubPaths.map(async (path) => {
      const url = new URL(path, import.meta.url);
      const json = await readJSON(url);
      const dist = resolve(dataDir, `${parse(path).base}.json`);
      const old = await readJSON(dist);
      // Not copy file, force to use LF.
      await writeJSON(dist, patchDeep(old, json));
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

/**
 * Remove `/c$/`
 * @param {string} version
 */
export function normalizeVersion(version) {
  const pattern = /^(\d+)\.(\d+)\.(\d+)c?$/;
  const match = pattern.exec(version);
  if (match == null) {
    throw new Error(`Version pattern not match: ${version}`);
  }
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${patch}`;
}
