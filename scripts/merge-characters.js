// @ts-check
import { main as characterFactorMain } from "./character-factor.js";
import { characterDataFile, charactersFile, charactersPatchFile } from "./files.js";
import { isNear, patchDeep, patchJSON } from "./utils.js";

const patch = await charactersPatchFile();

await patchJSON(charactersFile, (characters) => {
  const ids = new Set(characters.map((c) => c.character_id));
  for (const character of patch) {
    if (!ids.has(character.character_id)) {
      characters.push(character);
    }
  }
  characters.sort((a, b) => a.character_id - b.character_id);
});

const characters = await charactersFile();

// Generate new blank character data.
await patchJSON(characterDataFile, (characterData) => {
  const characterDataMap = new Map(characterData.map((c) => [c.id, c]));
  for (const character of characters) {
    const variantEn = character.variant?.en;
    const variantZh = character.variant?.["zh-Hans"];
    /** @type {(typeof characterData)[number]} */
    const characterItem = {
      id: character.character_id,
      levels: {},
      name: {
        en: character.display_name.en + (variantEn ? ` (${variantEn})` : ""),
        zh: character.display_name["zh-Hans"] + (variantZh ? `（${variantZh}）` : ""),
      },
    };
    const existingCharacter = characterDataMap.get(character.character_id);
    if (!existingCharacter) {
      characterData.push(characterItem);
    } else {
      // for exsiting characters, update to latest name
      Object.assign(existingCharacter.name, patchDeep(existingCharacter.name, characterItem.name));
    }
  }
  characterData.sort((a, b) => a.id - b.id);
});

// Generate factors
await characterFactorMain();

// Check factors
const characterData = await characterDataFile();
const charactersMap = new Map(characters.map((c) => [c.character_id, c]));

/**
 * @param {number} expected
 * @param {number} actual
 * @param {string} msg
 */
function checkNear(expected, actual, msg) {
  if (!isNear(expected, actual)) {
    console.error(`${msg} not match! expected: ${expected} actual: ${actual}`);
    return false;
  }
  return true;
}

for (const oneCharacter of characterData) {
  const character = charactersMap.get(oneCharacter.id);
  if (!character) {
    throw new Error(`Character id = ${oneCharacter.id} not found.`);
  }
  const factors = oneCharacter.levels[character.level];
  if (!factors) {
    throw new Error(`Character data (id=${character.character_id}) has no level ${character.level} factor!`);
  }
  /**
   * @param {string} type
   */
  const msg = (type) => `${type} of ${oneCharacter.name.en} (id=${oneCharacter.id})`;
  checkNear(character.frag, factors.frag, msg("frag"));
  checkNear(character.prog, factors.step, msg("step"));
  checkNear(character.overdrive, factors.over, msg("over"));
}
