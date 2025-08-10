// @ts-check
/// <reference path="./all-types.d.ts" />

import { getLocalPackList, getLocalSongList } from "./arcaea.js";
import { mergeIntoSongData } from "./merge-chart-data.js";
import { patchJSON, readJSON } from "./utils.js";
import { patchConstants } from "./constant-tools.js";
import {
  aliasFile,
  assetsInfoFile,
  chartConstant,
  chartDataFile,
  chartNotes,
  metaFile,
  songDataFile,
} from "./files.js";
import { patch } from "pragmatism";

const { version } = await metaFile();
const slst = await getLocalSongList(version);
const pklst = await getLocalPackList(version);
const alias = await aliasFile();
const assetsInfo = await assetsInfoFile();
const cc = await chartConstant();
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
