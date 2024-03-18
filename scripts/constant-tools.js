// @ts-check
/// <reference path="./all-types.d.ts" />

import { notesAndConstantsFile } from "./files.js";
import { patchJSON } from "./utils.js";

/**
 * @param {WikiChartConstantJSON} wikiCCJson
 */
export async function patchConstants(wikiCCJson) {
  const patched = await patchJSON(notesAndConstantsFile, (oldCC) => {
    const oldCCMap = Object.fromEntries(oldCC.map((song) => [song.id, song.charts]));
    /** @type {ExtraSongData[]} */
    const patched = Object.entries(wikiCCJson).map(([songId, charts]) => {
      return {
        id: songId,
        /** @type {ExtraSongData['charts']} */
        charts: Array.from({ length: 5 }, (_, difficulty) => {
          const item = charts[difficulty];
          if (item == null) {
            return null;
          }
          const notes = oldCCMap[songId]?.[difficulty]?.notes;
          if (notes == null) {
            console.log(`New chart: ${songId} ${difficulty}`);
          }
          return {
            notes: notes ?? 0,
            constant: item.constant,
          };
        }),
      };
    });
    return patched;
  });
  return patched;
}
