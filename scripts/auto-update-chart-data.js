// @ts-check
/// <reference path="./all-types.d.ts" />

import { getLocalPackList, getLocalSongList } from "./arcaea.js";
import { mergeIntoSongData } from "./merge-chart-data.js";
import { readJSON, writeJSON } from "./utils.js";
import { patchConstants } from "./constant-tools.js";
import { metaFile, songDataFile } from "./files.js";

const { version } = await metaFile();
const slst = await getLocalSongList(version);
const pklst = await getLocalPackList(version);
/** @type {Alias[]} */
const alias = await readJSON(new URL("../src/data/alias.json", import.meta.url));
/** @type {AssetsInfo} */
const assetsInfo = await readJSON(new URL("../src/data/assets-info.json", import.meta.url));
/** @type {WikiChartConstantJSON} */
const cc = await readJSON(new URL("../src/data/ChartConstant.json", import.meta.url));
const extraData = await patchConstants(cc);
const chartDataURL = new URL("../src/data/chart-data.json", import.meta.url);
/** @type {SongData[]} */
const oldSongData = await readJSON(chartDataURL);
const { songDataList, patchedSlst } = mergeIntoSongData(oldSongData, slst, pklst, extraData, alias, assetsInfo.songs, version);
await writeJSON(chartDataURL, songDataList);
await writeJSON(songDataFile.url, patchedSlst);
const notes = Object.fromEntries(extraData.map((item) => [item.id, item.charts.map((c) => c?.notes ?? null)]));
const notesURL = new URL("../src/data/notes.json", import.meta.url);
await writeJSON(notesURL, notes);
