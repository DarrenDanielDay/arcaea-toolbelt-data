// @ts-check
import { indexBy, notnull, writeJSON, isMain } from "pragmatism";
import { constantsFile, notesAndConstantsFile, notesFile, songDataFile, songlistFile } from "./files.js";

export async function generateMiniData() {
  const extraData = await notesAndConstantsFile();
  const songlist = await songlistFile();
  songlist.songs.sort((a, b) => a.idx - b.idx);
  const songData = await songDataFile();
  const songDataIndex = indexBy(songData.songs, (s) => s.idx);
  const extraDataMap = indexBy(extraData, (it) => it.id);
  /**
   * @param {Song} song
   * @param {number} ratingclass
   */
  function findChart(song, ratingclass) {
    return notnull(songDataIndex[song.idx]).difficulties.find((d) => d.ratingClass === ratingclass);
  }
  const notes = songlist.songs.map((song, i) => {
    if (i !== song.idx) {
      console.warn(`idx not match: ${i}, ${song.idx}`);
    }
    const notes = notnull(extraDataMap[song.id]).charts.map((c) => c?.notes ?? null);
    if (notes.some((n, i) => n != findChart(song, i)?.notes)) {
      console.warn(`Notes not match: ${song.id}`);
    }
    return notes;
  });
  await writeJSON(notesFile.url, notes);
  const constants = songlist.songs.map((song) => {
    const constants = notnull(extraDataMap[song.id]).charts.map((c) => c?.constant ?? null);
    if (constants.some((c, i) => c != findChart(song, i)?.constant)) {
      console.warn(`Constant not match: ${song.id}`);
    }
    return constants;
  });
  await writeJSON(constantsFile.url, constants);
}

if (isMain(import.meta.url)) {
  generateMiniData();
}
