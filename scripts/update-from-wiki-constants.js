// @ts-check
import { chartConstant, notesAndConstantsFile } from "./files.js";
import { patchJSON } from "./utils.js";

async function main() {
  await patchJSON(chartConstant, (json) => {
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => {
        v.length = 5;
        if (!v.at(4)) {
          v[4] = null;
        }
        return [k, v];
      })
    );
  });
  const wikicc = await chartConstant();
  await patchJSON(notesAndConstantsFile, (data) => {
    for (const item of data) {
      const songId = item.id;
      for (let difficulty = 0, l = item.charts.length; difficulty < l; difficulty++) {
        const chart = item.charts[difficulty];
        const wikiChart = wikicc[songId]?.[difficulty];
        if (!chart) {
          if (wikiChart) {
            console.warn(`new difficulty ${difficulty} of ${songId}`);
          }
          continue;
        }
        if (!wikiChart) {
          console.warn(`wiki difficulty ${difficulty} of ${songId} not found`);
          continue;
        }
        if (chart.constant !== wikiChart.constant) {
          console.log(`changed: ${difficulty} ${songId}: ${chart.constant} => ${wikiChart.constant}`);
          chart.constant = wikiChart.constant;
        }
      }
    }
  });
}

await main();
