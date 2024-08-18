// @ts-check
/// <reference path="./all-types.d.ts" />

import { getLatestVersion } from "./apk.js";
import { getLocalPackList, getLocalSongList } from "./arcaea.js";
import { mergeIntoSongData } from "./merge-chart-data.js";
import { readJSON, writeJSON } from "./utils.js";
import { patchConstants } from "./constant-tools.js";

const apkInfo = await getLatestVersion();
const { version } = apkInfo;
const slst = await getLocalSongList(version);
const pklst = await getLocalPackList(version);
/** @type {Alias[]} */
const alias = await readJSON(new URL("../src/data/alias.json", import.meta.url));
/** @type {SongAssetsInfo[]} */
const assetsInfo = await readJSON(new URL("../src/data/assets-info.json", import.meta.url));
/** @type {WikiChartConstantJSON} */
const cc = await readJSON(new URL("../src/data/ChartConstant.json", import.meta.url));
const extraData = await patchConstants(cc);
const url = new URL("../src/data/chart-data.json", import.meta.url);
/** @type {SongData[]} */
const oldSongData = await readJSON(url);
const songData = mergeIntoSongData(oldSongData, slst, pklst, extraData, alias, assetsInfo);
await writeJSON(url, songData);
