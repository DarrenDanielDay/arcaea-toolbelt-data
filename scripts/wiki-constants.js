// @ts-check
import data from "../src/data/notes-and-constants.json" assert { type: "json" };
import { output } from "./utils.js";

/** @type {{ constant: number; old: boolean; }[]} */
const wikiConstantList = [];

const wikiJSON = Object.fromEntries(
  data.map((song) => [
    song.id,
    song.charts.reduce((list, curr) => {
      if (curr) {
        list.push({
          constant: curr.constant,
          old: false,
        });
      }
      return list;
    }, structuredClone(wikiConstantList)),
  ])
);

const text = JSON.stringify(wikiJSON, undefined, 4);

await output("wiki.arcaea.cn/ChartConstant.json", text);
