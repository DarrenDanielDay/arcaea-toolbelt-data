import { getCharacterData } from "./get-wiki-character-data";
import { fetchWikiWorldMapData } from "./get-wiki-world-map-data";
import { SongData } from "@arcaea-toolbelt/models/music-play";
import { PackList, SongList } from "./packed-data";
import { indexBy } from "@arcaea-toolbelt/utils/collections";
import {
  getProjectRootDirectory,
  saveJSON,
  patchJSON,
  readProjectJSON,
  saveProjectJSON,
} from "./shared";
import { APKResponse, getLatestVersion } from "./get-latest-version";
import { ArcaeaToolbeltMeta } from "@arcaea-toolbelt/models/misc";
import { getChartDataFromFandomWiki } from "./chart/fandom-wiki";
import { mergeIntoSongData } from "./chart/merge";
import { getAliasFromArcaeaInfinity } from "./chart/arcaea-infinity";
import { Alias, ExtraSongData, mergeArray } from "./chart/shared";
import { CharacterData } from "@arcaea-toolbelt/models/character";

async function getSongList(): Promise<SongList> {
  const res = await readProjectJSON<SongList>("/src/data/songlist.json");
  return res;
}

async function getPackList(): Promise<PackList> {
  const res = await readProjectJSON<PackList>("/src/data/packlist.json");
  return res;
}


const characterDataPath = "/src/data/character-data.json";
const itemDataPath = "/src/data/item-data.json";
const worldMapLongTermPath = "/src/data/world-maps-longterm.json";
const worldMapEventsPath = "/src/data/world-maps-events.json";
const extraDataPath = "/src/data/notes-and-constants.json";
const aliasPath = "/src/data/alias.json";
const assetsInfoPath = "/src/data/assets-info.json";
const chartDataPath = "/src/data/chart-data.json";

export async function updateNotesAndConstantsFileViaFandomWiki() {
  const projectRoot = await getProjectRootDirectory();
  const songList = await getSongList();
  const fandomWikiData = await getChartDataFromFandomWiki(songList);
  const old = await readProjectJSON<ExtraSongData[]>(extraDataPath);
  await saveJSON(
    projectRoot,
    mergeArray(
      old,
      fandomWikiData,
      (d) => d.id,
      (old) => {
        // Fandom Wiki 有很多数据有误，暂时只添加新数据
        return old;
      }
    ),
    extraDataPath
  );
}

export async function generateCharacterData() {
  const { characters, items } = await getCharacterData();
  await saveProjectJSON(characters, characterDataPath);
  await saveProjectJSON(items, itemDataPath);
}

export async function generateAlias() {
  const oldAlias = await readProjectJSON<Alias[]>(aliasPath);
  const latestAlias = await getAliasFromArcaeaInfinity();
  const newAlias = mergeArray(
    oldAlias,
    latestAlias,
    (a) => a.id,
    (a, b) => ({
      id: a.id,
      alias: [...new Set([...a.alias, ...b.alias])],
    })
  );
  await saveProjectJSON(newAlias, aliasPath);
}

export async function generateMergedChartData() {
  const old = await getOldChartData();
  const songList = await getSongList();
  const packList = await getPackList();
  const extraData = await readProjectJSON<ExtraSongData[]>(extraDataPath);
  const alias = await readProjectJSON<Alias[]>(aliasPath);
  const assetsInfo = await readProjectJSON<SongAssetsInfo[]>(assetsInfoPath);
  const newData = mergeIntoSongData(old, songList, packList, extraData, alias, assetsInfo);
  await saveProjectJSON(sortChartDataBySongListIdx(newData, songList), chartDataPath);
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

async function getOldChartData() {
  const old: SongData[] = await readProjectJSON(chartDataPath);
  return old;
}

function mergeChartData(oldData: SongData[], newData: SongData[]) {
  const oldIndex = oldData.reduce<{ [songId: string]: SongData }>((index, item) => {
    index[item.id] = item;
    return index;
  }, {});
  const newSongs: SongData[] = [];
  for (const item of newData) {
    const oldSong = oldIndex[item.id];
    if (!oldSong) {
      console.log(`新曲目：${item.name}`);
      newSongs.push(item);
    } else {
      // 合并alias
      newSongs.push({
        ...item,
        alias: [...new Set([...oldSong.alias, ...item.alias])],
      });
    }
  }
  return newSongs;
}

function sortChartDataBySongListIdx(songs: SongData[], songList: SongList) {
  const index = indexBy(songList.songs, (s) => s.id);
  return songs.sort((a, b) => index[a.id]!.idx - index[b.id]!.idx);
}
