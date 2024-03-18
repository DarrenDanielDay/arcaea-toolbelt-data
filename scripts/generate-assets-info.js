// @ts-check
/// <reference path="./all-types.d.ts" />
import { readdir } from "fs/promises";
import { join, parse } from "path";
import { readJSON, writeJSON } from "./utils.js";
import { extractName as ex } from "./arcaea.js";
import { fileURLToPath } from "url";

/**
 * @param {string} [version]
 */
export async function generateAssetsInfo(version) {
  version ||= (
    await import("../src/data/meta.json", {
      assert: { type: "json" },
      with: { type: "json" },
    })
  ).default.version;
  console.log(`Generating assets info.`);
  console.log(`Current version is ${version}.`);
  const extractName = ex(version);
  /**
   * @param {string} path
   */
  function assets(path) {
    return join(`arcaea/${extractName}/assets`, path);
  }
  /** @type {import('../src/tools/packed-data').SongList} */
  const songList = await readJSON(assets("songs/songlist"));

  /**
   * @param {import('../src/tools/packed-data').Song} song
   * @returns {Promise<import('../src/tools/chart/shared').AssetsInfo>}
   */
  async function getSongAssets(song) {
    const folder = song.remote_dl ? `dl_${song.id}` : song.id;
    const children = await readdir(assets(`songs/${folder}`));
    return {
      id: song.id,
      covers: children.filter((file) => file.endsWith(".jpg")),
    };
  }
  /** @type {import('../src/tools/chart/shared').AssetsInfo[]} */
  const assetsInfo = await Promise.all(songList.songs.map(getSongAssets));
  await writeJSON("src/data/assets-info.json", assetsInfo);
  console.log(
    assetsInfo.filter((a) => {
      // 用于测试对应的*_256.jpg是否一定有
      for (const cover of a.covers) {
        if (cover.match(/^(1080_)(base|0|1|2|3|4)\.jpg$/)) {
          if (!a.covers.includes(cover.replace(".jpg", "_256.jpg"))) {
            return true;
          }
        }
      }
      return false;
    })
  );
  console.log(`Generate assets info done.`);
}

if (process.argv.some((arg) => arg.includes(parse(fileURLToPath(import.meta.url)).base))) {
  generateAssetsInfo();
}
