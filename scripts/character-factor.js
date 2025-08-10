// @ts-check
/// <reference path="./all-types.d.ts" />

import { readFile } from "fs/promises";
import { patchJSON, writeJSON } from "./utils.js";
import { fileURLToPath } from "url";
import { parse } from "path";
import { factorsFile, characterDataFile } from "./files.js";

async function convertCSV() {
  const content = await readFile(new URL("./factors.csv", import.meta.url), "utf-8");
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
      step: [f(2), f(5), f(8)],
      over: [f(3), f(6), f(9)],
    };
    return factors;
  });
  await writeJSON(factorsFile.url, factors);
  return factors;
}
/**
 *
 * @param {number} level
 * @param {number | null | undefined} f1
 * @param {number | null | undefined} f20
 * @param {number | null | undefined} f30
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

/**
 *
 * @param {KeyFactors[]} keyFactorsList
 */
export async function generateFactorsByKeyFactors(keyFactorsList) {
  return await patchJSON(characterDataFile, (characterData) => {
    /** @type {Record<number, CharacterD>} */
    const map = {};
    const keyed = characterData.reduce((map, character) => {
      map[character.id] = character;
      return map;
    }, map);
    for (const keyFactors of keyFactorsList) {
      const [f1, f20, f30] = keyFactors.frag;
      let min = 1,
        max = f30 == null ? 20 : 30;
      if (f1 == null) {
        console.log(`Special character not starting with level 1, id=${keyFactors.id}.`);
        min = 20;
      }
      const character = keyed[keyFactors.id];
      if (!character) {
        console.log(`Character data for id = ${keyFactors.id} not found.`);
        continue;
      }
      if (f20 == null) {
        console.log(`Character ${character.name.en} (id = ${character.id}) has no lv20 factor!`);
        continue;
      }
      for (let level = min; level <= max; ++level) {
        const currentFactors = character.levels[level];
        /**
         * @param {keyof CharacterFactors} name
         */
        const generateFactor = (name) => {
          const value = fitFactor(level, ...keyFactors[name]);
          const old = currentFactors?.[name];
          /**
           * @param {number} v value
           * @param {number} l length
           */
          const space = (v, l) => v.toString().padEnd(l, " ");
          if (old != null && Math.abs(old - value) >= 1) {
            console.log(
              `Generated factor ${name} of ${character.name.en} at level ${space(
                level,
                2
              )} may be invalid. old = ${space(old, 5)} new = ${space(value, 5)}`
            );
          }
          return value;
        };
        character.levels[level] = {
          frag: generateFactor("frag"),
          over: generateFactor("over"),
          step: generateFactor("step"),
        };
        if (!currentFactors) {
          console.log(`Generated new factors for level ${level} of id = ${character.id}.`);
        }
      }
    }
  });
}

export async function main() {
  const factors = await convertCSV();
  await generateFactorsByKeyFactors(factors);
}

if (process.argv.some((arg) => arg.includes(parse(fileURLToPath(import.meta.url)).base))) {
  main();
}
