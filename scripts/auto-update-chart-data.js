// @ts-check
/// <reference path="./all-types.d.ts" />

import { getLocalPackList, getLocalSongList } from "./arcaea.js";
import { mergeIntoSongData } from "./merge-chart-data.js";
import { patchJSON, readJSON, writeJSON } from "./utils.js";
import { patchConstants } from "./constant-tools.js";
import { chartDataFile, chartNotes, metaFile, songDataFile } from "./files.js";
import { patch } from "pragmatism";

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
await patchJSON(chartDataFile, async (oldSongData) => {
  const { songDataList, patchedSlst } = mergeIntoSongData(
    oldSongData,
    slst,
    pklst,
    extraData,
    alias,
    assetsInfo.songs,
    version
  );
  await patchJSON(songDataFile, (old) => ({
    ...old,
    version: patchedSlst.version,
    songs: patchedSlst.songs.map((newSong, i) => {
      const oldSong = old.songs[i];
      if (!oldSong) {
        console.log(`new song: ${newSong.id}`);
        return newSong;
      }
      return patch(oldSong, newSong);
    }),
  }));
  await patchJSON(chartNotes, () =>
    Object.fromEntries(extraData.map((item) => [item.id, item.charts.map((c) => c?.notes ?? null)]))
  );
  return songDataList;
});
