// @ts-check
/// <reference path="./all-types.d.ts" />

import extract from "extract-zip";
import { patchJSON, pathLikeToString } from "./utils.js";
import { metaFile } from "./files.js";

/**
 * @returns {Promise<APKResponse>}
 */
export async function getLatestVersion() {
  const res = await fetch("https://webapi.lowiro.com/webapi/serve/static/bin/arcaea/apk", {
    mode: "cors",
    credentials: "omit",
    cache: "no-cache",
    referrer: "https://arcaea.lowiro.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
  });
  const data = await res.json();
  if (!data?.success) throw new Error(data ? JSON.stringify(data) : "Failed to get APK info.");
  return data.value;
}

/**
 * @param {PathLike} path
 * @param {PathLike} dist
 */
export async function extractAPK(path, dist) {
  await extract(pathLikeToString(path), {
    dir: pathLikeToString(dist),
  });
}

/**
 * @param {APKResponse} info
 */
export async function updateVersionMeta(info) {
  await patchJSON(metaFile, (meta) => {
    meta.time = Date.now();
    meta.apk = info.url;
    meta.version = info.version;
  });
  console.log("Version meta updated.");
}
