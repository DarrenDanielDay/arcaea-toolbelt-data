// @ts-check
/**
 * @typedef {[lv1: number | null, lv20: number | null, lv30: number | null]} KeyFactor
 * @typedef {{
 *   id: number;
 *   frag: KeyFactor;
 *   step: KeyFactor;
 *   over: KeyFactor;
 * }} KeyFactors
 *
 */

import { readFile } from "fs/promises";
import { readJSON, writeJSON } from "./utils.js";

const baseFactorsFile = "./src/data/factors.json";
const characterDataFile = "./src/data/character-data.json";

async function convertCSV() {
  const content = await readFile("./scripts/factors.csv", "utf-8");
  const lines = content.split(/\r?\n/g).filter((line, i) => !!line && i > 0);
  const factors = lines.map((line) => {
    const numbers = line.split(",");
    const id = +(numbers[0] || "");
    /**
     * @param {number} idx
     */
    const f = (idx) => {
      const value = numbers[idx] || "";
      if (value.trim()) {
        return +value;
      }
      return null;
    };
    /** @type {KeyFactors} */
    const factors = {
      id,
      frag: [f(1), f(4), f(7)],
      over: [f(3), f(6), f(9)],
      step: [f(2), f(5), f(8)],
    };
    return factors;
  });
  await writeJSON(baseFactorsFile, factors);
}
/**
 *
 * @param {number} level
 * @param {number | null} f1
 * @param {number | null} f20
 * @param {number | null} f30
 */
export function fitFactor(level, f1, f20, f30) {
  if (level <= 0 || level > 30 || (f30 == null && level > 20)) {
    throw new Error(`Invalid level ${level}.`);
  }
  if (f20 == null) {
    throw new Error(`Missing f20.`);
  }
  if (f30 != null && level >= 20) {
    return f20 + ((f30 - f20) * (level - 20)) / 10;
  }
  if (f1 == null) {
    throw new Error(`Missing f1.`);
  }
  return (
    (f1 + f20) / 2 +
    ((f20 - f1) * (Math.sign(level - 10.5) * ((Math.abs(level - 10.5) - 9.5) ** 3 + 9.5 ** 3))) / (2 * 9.5 ** 3)
  );
}

export async function assignFactors() {
  /** @type {KeyFactors[]} */
  const factors = await readJSON(baseFactorsFile);
  /** @type {import('@arcaea-toolbelt/models/character').CharacterData[]} */
  const characterData = await readJSON(characterDataFile);
  /** @type {Record<number, KeyFactors>} */
  const map = {};
  const keyed = factors.reduce((map, factors) => {
    map[factors.id] = factors;
    return map;
  }, map);
  characterData.forEach((character) => {
    const factors = keyed[character.id];
    if (!factors) {
      console.error(`Factors of ${character.name.en} found.`);
      return;
    }
    for (const level in character.levels) {
      const currentFactors = character.levels[level];
      if (currentFactors == null) {
        continue;
      }
      try {
        /**
         * @param {keyof import('@arcaea-toolbelt/models/character').CharacterFactors} name
         */
        const changeFactor = (name) => {
          const newValue = fitFactor(+level, ...factors[name]);
          if (Math.abs(newValue - currentFactors[name]) > 1) {
            console.log(`Computed result maybe invalid:`, {
              character: character.name.en,
              level,
              name,
              newValue,
              current: currentFactors[name],
            });
            // currentFactors[name] = newValue;
          } else {
            currentFactors[name] = newValue;
          }
        };
        changeFactor("frag");
        changeFactor("over");
        changeFactor("step");
      } catch (error) {
        console.error(`Generate factor failed for ${character.name.en} at level ${level}`);
        throw error;
      }
    }
  });
  await writeJSON(characterDataFile, characterData);
}

async function main() {
  await convertCSV();
  await assignFactors();
}

main();
