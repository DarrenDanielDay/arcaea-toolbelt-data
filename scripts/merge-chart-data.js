// @ts-check
/// <reference path="./all-types.d.ts" />

import { clone, notnull, patch } from "pragmatism/core";
import { normalizeVersion } from "./arcaea.js";
import { indexBy } from "./utils.js";
import { difficulties } from "arcaea-toolbelt-core/constants";
/**
 *
 * @param {Indexed<Pack>} packIndex
 * @param {Song} song
 * @returns
 */
function getPackName(packIndex, song) {
  const pack = packIndex[notnull(song.set)];
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
 * @param {string} version
 * @returns {{ songDataList: SongData[], patchedSlst: PatchedSongList }}
 */
export function mergeIntoSongData(oldData, songList, packList, extraData, alias, assetsInfo, version) {
  const oldIndex = indexBy(oldData, (song) => song.id);
  const packIndex = indexBy(packList.packs, (pack) => pack.id);
  const aliasIndex = indexBy(alias, (a) => a.id);
  const extraIndex = indexBy(extraData, (extra) => extra.id);
  const assetsIndex = indexBy(assetsInfo, (a) => a.id);
  const songData = songList.songs.map((song) => {
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
            deleted: normalizeVersion(version),
          },
        };
      } else {
        console.log(`"${songId}" is already deleted. Just keep the data.`);
        return old;
      }
    }
    const extra = extraIndex[songId];
    /** @type {import("@arcaea-toolbelt/models/music-play.js").Chart[]} */
    const charts = [];
    for (const difficulty of notnull(song.difficulties)) {
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
      bpm: notnull(song.bpm),
      side: notnull(song.side),
      id: songId,
      name: notnull(song.title_localized).en,
      // @ts-ignore
      covers: assetsIndex[songId].covers,
      pack: getPackName(packIndex, song),
      dl: !!song.remote_dl,
      alias: aliasIndex[songId]?.alias ?? [],
      charts,
      version: {
        added: notnull(song.version),
      },
    };
    return songData;
  });
  /** @type {PatchedSongList} */
  // @ts-expect-error
  const patchedSlst = clone(songList);
  patchedSlst.version = version;
  patchedSlst.songs.forEach((song) => {
    /** @type {SongExtraData} */
    const patches = {
      alias: aliasIndex[song.id]?.alias ?? [],
      jackets: assetsIndex[song.id]?.covers ?? [],
    };
    patch(song, patches);
    if (song.deleted) {
      // TODO patch particle arts legacy song list data
      return;
    }
    song.difficulties.forEach((d) => {
      if (song.id === 'lasteternity') {
        return;
      }
      const extraData = notnull(extraIndex[song.id]?.charts[d.ratingClass], `extra ${song.id} ${d.ratingClass}`);
      patch(d, extraData);
    });
  });
  return { songDataList: songData, patchedSlst };
}
