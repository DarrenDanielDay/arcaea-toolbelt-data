// @ts-check
import { existsSync } from "fs";
import { getLatestVersion, updateVersionMeta } from "./apk.js";
import { extractArcaeaAPK, copyKeyFiles } from "./arcaea.js";
import { generateAssetsInfo } from "./generate-assets-info.js";
import { buildStatic, generateIndex } from "./json-data.js";
import { downloadFileWithNode } from "./utils.js";

const apkInfo = await getLatestVersion();
const apkURL = new URL(`../arcaea/apk/${apkInfo.version}.apk`, import.meta.url);
if (!existsSync(apkURL)) {
  await downloadFileWithNode(apkInfo.url, apkURL);
  await extractArcaeaAPK(apkInfo.version);
}
await generateAssetsInfo(apkInfo.version);
await updateVersionMeta(apkInfo);
await copyKeyFiles(apkInfo.version);
await generateIndex();
await buildStatic();
