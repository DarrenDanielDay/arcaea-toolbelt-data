// @ts-check
/// <reference path="./all-types.d.ts" />

import { readJSON } from "./utils.js";

/**
 * @param {string} path
 * @returns {JSONResource<any>}
 */
function resource(path) {
  const url = new URL(path, import.meta.url);
  function read() {
    return readJSON(url);
  }
  read.url = url;
  return read;
}

/** @type {JSONResource<Alias[]>} */
export const aliasFile = resource("../src/data/alias.json");

/** @type {JSONResource<AssetsInfo>} */
export const assetsInfoFile = resource("../src/data/assets-info.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").CharacterData[]>} */
export const characterDataFile = resource("../src/data/character-data.json");

/** @type {JSONResource<typeof import('../src/data/characters.json')>} */
export const charactersPatchFile = resource("../src/data/characters-patch.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").$616.CharacterStat[]>} */
export const charactersFile = resource("../src/data/characters.json");

/** @type {JSONResource<SongData[]>} */
export const chartDataFile = resource("../src/data/chart-data.json");

/** @type {JSONResource<wiki.ChartConstant>} */
export const chartConstant = resource("../src/data/ChartConstant.json");

/** @type {JSONResource<wiki.ChartNotes>} */
export const chartNotes = resource("../src/data/ChartNotes.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").mini.DataTable<(number | null)[]>>} */
export const constantsFile = resource("../src/data/constants.json");

/** @type {JSONResource<KeyFactors[]>} */
export const factorsFile = resource("../src/data/factors.json");

/** @type {JSONResource<{name: string; img: string;}[]>} */
export const itemDataFile = resource("../src/data/item-data.json");

/** @type {JSONResource<ItemData[]>} */
export const itemsFile = resource("../src/data/items.json");

/** @type {JSONResource<ArcaeaToolbeltMeta>} */
export const metaFile = resource("../src/data/meta.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").mini.DataTable<(number | null)[]>>} */
export const notesFile = resource("../src/data/notes.json");

/** @type {JSONResource<ExtraSongData[]>} */
export const notesAndConstantsFile = resource("../src/data/notes-and-constants.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").PatchedSongList>} */
export const songDataFile = resource("../src/data/song-data.json");

/** @type {JSONResource<SongList>} */
export const songlistFile = resource("../src/data/song-data.json");

/** @type {JSONResource<import("../src/data/world-maps-events.json")>} */
export const worldMapEventsFile = resource("../src/data/world-map-events.json");
