// @ts-check
/// <reference path="./all-types.d.ts" />

import { normalizeVersion } from "./arcaea.js";
import { indexBy } from "./utils.js";
const difficulties = ["pst", "prs", "ftr", "byd", "etr"];
/**
 *
 * @param {Indexed<Pack>} packIndex
 * @param {Song} song
 * @returns
 */
function getPackName(packIndex, song) {
  const pack = packIndex[song.set];
  if (pack) {
    /** @type {string[]} */
    const segments = [];
    for (let /** @type {Pack | undefined} */ p = pack; p; p = p.pack_parent ? packIndex[p.pack_parent] : undefined) {
      segments.push(p.name_localized.en);
    }
    return segments.reverse().join(" - ");
  }
  return "Memory Archive";
}

/**
 *
 * @param {SongData[]} oldData
 * @param {SongList} songList
 * @param {PackList} packList
 * @param {ExtraSongData[]} extraData
 * @param {Alias[]} alias
 * @param {SongAssetsInfo[]} assetsInfo
 * @param {APKResponse} apkInfo
 * @returns {SongData[]}
 */
export function mergeIntoSongData(oldData, songList, packList, extraData, alias, assetsInfo, apkInfo) {
  const oldIndex = indexBy(oldData, (song) => song.id);
  const packIndex = indexBy(packList.packs, (pack) => pack.id);
  const aliasIndex = indexBy(alias, (a) => a.id);
  const extraIndex = indexBy(extraData, (extra) => extra.id);
  const assetsIndex = indexBy(assetsInfo, (a) => a.id);
  return songList.songs.map((song) => {
    const songId = song.id;
    // TODO 合并处理旧数据？
    const old = oldIndex[songId];
    if (song.deleted) {
      if (!old) {
        throw new Error(`Expected old song data to exist, songId=${songId}`);
      }
      if (!old.version.deleted) {
        console.log(`New deleted songId: ${songId}`);
        return {
          ...old,
          version: {
            ...old.version,
            deleted: normalizeVersion(apkInfo.version),
          },
        };
      }
    }
    const extra = extraIndex[songId];
    /** @type {import("@arcaea-toolbelt/models/music-play.js").Chart[]} */
    const charts = [];
    for (const difficulty of song.difficulties) {
      if (difficulty.hidden_until === "always") {
        // Last | Eternity PST/PRS/FTR
        continue;
      }
      const { ratingClass, rating, ratingPlus, jacketOverride, title_localized, bpm, chartDesigner } = difficulty;
      const extraData = extra?.charts[ratingClass];
      /** @type {Chart} */
      const chart = {
        constant: extraData?.constant ?? -1,
        // @ts-ignore
        difficulty: difficulties[ratingClass],
        designer: chartDesigner,
        id: `${songId}@${difficulties[ratingClass]}`,
        level: rating,
        note: extraData?.notes ?? -1,
        songId,
      };
      if (ratingPlus) {
        chart.plus = true;
      }
      /** @type {ChartOverride} */
      const override = {};
      if (jacketOverride) {
        override.cover = true;
      }
      if (title_localized) {
        override.name = title_localized.en;
      }
      if (bpm) {
        override.bpm = bpm;
      }
      if (Object.keys(override).length) {
        chart.override = override;
      }
      charts.push(chart);
    }
    /** @type {SongData} */
    const songData = {
      bpm: song.bpm,
      side: song.side,
      id: songId,
      name: song.title_localized.en,
      // @ts-ignore
      covers: assetsIndex[songId].covers,
      pack: getPackName(packIndex, song),
      dl: !!song.remote_dl,
      alias: aliasIndex[songId]?.alias ?? [],
      charts,
      version: {
        added: song.version,
      },
    };
    return songData;
  });
}
