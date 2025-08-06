// @ts-check
/// <reference path="./all-types.d.ts" />

import { ratingClasses } from "arcaea-toolbelt-core/constants";
import { notesAndConstantsFile } from "./files.js";
import { patchJSON } from "./utils.js";

/**
 * Update `notes-and-constants.json` via ChartConstant.json.
 * @param {WikiChartConstantJSON} wikiCCJson
 */
export async function patchConstants(wikiCCJson) {
  const patched = await patchJSON(notesAndConstantsFile, (oldCC) => {
    const oldCCMap = Object.fromEntries(oldCC.map((song) => [song.id, song.charts]));
    const songIds = new Set(oldCC.map((item) => item.id)).union(new Set(Object.keys(wikiCCJson)));
    /** @type {ExtraSongData[]} */
    const patched = [...songIds].map((songId) => {
      const wikiCharts = wikiCCJson[songId];
      return {
        id: songId,
        /** @type {ExtraSongData['charts']} */
        charts: Array.from(ratingClasses, (ratingClass) => {
          const wikiChart = wikiCharts?.[ratingClass];
          const oldChart = oldCCMap[songId]?.[ratingClass];
          if (wikiChart == null && oldChart != null) {
            console.log(
              `Chart ${songId} ${ratingClass} not found in ChartConstant.json but found in notes-and-constants.json.`
            );
            return oldChart;
          }
          if (wikiChart != null && oldChart == null) {
            console.log(`New chart: ${songId} ${ratingClass}, please add note.`);
            return {
              notes: 0,
              constant: wikiChart.constant,
            };
          }
          if (wikiChart != null && oldChart != null) {
            return {
              notes: oldChart.notes,
              constant: wikiChart.constant,
            };
          }
          return null;
        }),
      };
    });
    return patched;
  });
  return patched;
}
