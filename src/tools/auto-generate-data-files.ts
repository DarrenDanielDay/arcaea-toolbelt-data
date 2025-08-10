import { getCharacterData } from "./get-wiki-character-data";
import { fetchWikiWorldMapData } from "./get-wiki-world-map-data";
import { getProjectRootDirectory, patchJSON, readProjectJSON, saveProjectJSON } from "./shared";
import { APKResponse } from "./get-latest-version";
import { ArcaeaToolbeltMeta } from "arcaea-toolbelt-core/models";
import { CharacterData } from "arcaea-toolbelt-core/models";

const characterDataPath = "/src/data/character-data.json";
const itemDataPath = "/src/data/item-data.json";
const worldMapLongTermPath = "/src/data/world-maps-longterm.json";
const worldMapEventsPath = "/src/data/world-maps-events.json";
const chartDataPath = "/src/data/chart-data.json";

export async function generateCharacterData() {
  const { characters, items } = await getCharacterData();
  await saveProjectJSON(characters, characterDataPath);
  await saveProjectJSON(items, itemDataPath);
}

export async function generateWorldMapData() {
  const songs = await readProjectJSON<SongData[]>(chartDataPath);
  const characters = await readProjectJSON<CharacterData[]>(characterDataPath);
  const { longterm, events } = await fetchWikiWorldMapData(songs, characters);
  await saveProjectJSON(longterm, worldMapLongTermPath);
  await saveProjectJSON(events, worldMapEventsPath);
}

export async function generateVersionMeta(apkInfo: APKResponse) {
  await patchMeta({
    version: apkInfo.version,
    apk: apkInfo.url,
  });
}

async function patchMeta(meta: Partial<ArcaeaToolbeltMeta>) {
  meta.time ??= Date.now();
  await patchJSON(await getProjectRootDirectory(), meta, "/src/data/meta.json");
}
