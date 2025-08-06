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

/** @type {JSONResource<ArcaeaToolbeltMeta>} */
export const metaFile = resource("../src/data/meta.json");

/** @type {JSONResource<ExtraSongData[]>} */
export const notesAndConstantsFile = resource("../src/data/notes-and-constants.json");

/** @type {JSONResource<KeyFactors[]>} */
export const keyFactorsListFile = resource("../src/data/factors.json");

/** @type {JSONResource<import("@arcaea-toolbelt/models/character.js").CharacterData[]>} */
export const characterDataFile = resource("../src/data/character-data.json");

/** @type {JSONResource<WikiChartConstantJSON>} */
export const chartConstant = resource("../src/data/ChartConstant.json");

/** @type {JSONResource<typeof import('../src/data/characters.json')>} */
export const charactersFile = resource("../src/data/characters.json");

/** @type {JSONResource<typeof import('../src/data/characters.json')>} */
export const charactersPatchFile = resource("../src/data/characters-patch.json");

/** @type {JSONResource<import("../src/data/chart-data.json")>} */
export const chartDataFile = resource("../src/data/chart-data.json");

/** @type {JSONResource<import("arcaea-toolbelt-core/models").PatchedSongList>} */
export const songDataFile = resource("../src/data/song-data.json");

/** @type {JSONResource<import("../src/data/world-maps-events.json")>} */
export const worldMapEventsFile = resource("../src/data/world-map-events.json");


