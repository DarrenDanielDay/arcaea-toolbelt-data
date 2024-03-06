// @ts-check
import { readdir } from "fs/promises";
import { join } from "path";
import meta from "../src/data/meta.json" assert { type: "json" };
import { readJSON, writeJSON } from "./utils.js";

const version = meta.version;
const extractName = `arcaea_${version}`;

/**
 * @param {string} path
 */
function assets(path) {
  return join(`arcaea/${extractName}/assets`, path);
}

async function main() {
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
        if (cover.match(/^(1080_)(base|0|1|2|3)\.jpg$/)) {
          if (!a.covers.includes(cover.replace(".jpg", "_256.jpg"))) {
            return true;
          }
        }
      }
      return false;
    })
  );
}

main();
