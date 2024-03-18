
/**
 * @param {WikiChartConstantJSON} wikiCCJson
 * @param {import("../src/tools/packed-data.js").SongList} slst
 */
export function sortConstants(wikiCCJson, slst) {
  /** @type {WikiChartConstantJSON} */
  const result = {};
  const sorted = Object.keys(wikiCCJson).sort((a, b) => {
    const indexA = slst.songs.findIndex((s) => s.id === a);
    const indexB = slst.songs.findIndex((s) => s.id === b);
    if (indexA === -1) {
      console.log(`${a} not found in slst.`);
      return indexB - indexA;
    }
    if (indexB === -1) {
      console.log(`${b} not found in slst.`);
      return -1;
    }
    return indexA - indexB;
  });
  for (const key of sorted) {
    const items = wikiCCJson[key];
    if (!items) {
      throw new Error(`Impossible null for sid ${key}.`);
    }
    result[key] = items;
  }
  return result;
}
