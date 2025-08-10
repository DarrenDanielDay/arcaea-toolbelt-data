// @ts-check
/// <reference path="./all-types.d.ts" />
import { readdir } from "fs/promises";
import { join, parse } from "path";
import { patchJSON, readJSON, writeJSON } from "./utils.js";
import { extractName as ex } from "./arcaea.js";
import { fileURLToPath } from "url";
import { assetsInfoFile, itemDataFile, itemsFile } from "./files.js";
import { BannerType } from "arcaea-toolbelt-core/constants";

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
  /** @type {import("arcaea-toolbelt-core/models").$616.SongList} */
  const songList = await readJSON(assets("songs/songlist"));

  /**
   * @param {import("arcaea-toolbelt-core/models").$616.Song} song
   * @returns {Promise<SongAssetsInfo>}
   */
  async function getSongAssets(song) {
    const folder = song.remote_dl ? `dl_${song.id}` : song.id;
    const children = await readdir(assets(`songs/${folder}`));
    return {
      id: song.id,
      covers: children.filter((file) => file.endsWith(".jpg")),
    };
  }

  /**
   * @returns {Promise<Banner[]>}
   */
  async function checkBannerAssets() {
    const children = await readdir(assets(`img/course/banner`));
    /** @type {Banner[]} */
    const banners = [];
    /** @type {Map<number, string>} */
    const courses = new Map();
    for (const child of children) {
      let match = /course_banner_(\d+)\.png/.exec(child);
      if (match) {
        courses.set(+(match[1] ?? 1), child);
        continue;
      }
      match = /online_banner_(\d+)_(\d+)\.png/.exec(child);
      if (match) {
        banners.push({
          type: BannerType.ArcaeaOnline,
          file: child,
          year: +(match[1] ?? 1970),
          month: +(match[2] ?? 1),
        });
      }
    }
    const courseBanners = [...courses]
      .map(([key, value]) => {
        /** @type {CourseBanner} */
        const courseBanner = { type: BannerType.Course, file: value, level: key };
        return courseBanner;
      })
      .sort((a, b) => a.level - b.level);
    return banners.concat(courseBanners);
  }
  async function checkItemAssets() {
    const children = await readdir(assets(`img`));
    /** @type {{file: string, shortId: string}[]} */
    const items = [];
    for (const file of children) {
      const pattern = /core_(\w+)\.png/;
      const match = pattern.exec(file);
      if (match) {
        items.push({
          file,
          shortId: `${match[1]}`,
        });
      }
    }
    items.sort((a, b) => {
      const na = +a.shortId;
      const nb = +b.shortId;
      if (isNaN(na) || isNaN(nb)) {
        return na < nb ? -1 : 1;
      }
      return na - nb;
    });
    await patchJSON(itemsFile, async (oldItems) => {
      /** @type {ItemData[]} */
      const newItems = [];
      for (const it of items) {
        const old = oldItems.find((item) => item.file === it.file);
        if (!old) {
          console.log(`New item: ${it.file}`);
          newItems.push({
            file: it.file,
            id: "",
            name: {
              en: "",
              zh: "",
            },
          });
        }
      }
      const assetsItems = [...oldItems, ...newItems];
      const wikiItemNames = new Set((await itemDataFile()).map((it) => it.name));
      const filledItemNames = new Set(assetsItems.map((it) => it.name.zh).filter((x) => x !== ""));
      const missing = wikiItemNames.difference(filledItemNames);
      if (missing.size) {
        console.warn(`Missing item name(s), update from wiki? ${[...missing].join(", ")}`);
      }
      const unknown = filledItemNames.difference(wikiItemNames);
      if (unknown.size) {
        console.warn(`Unknown item name(s), typo? ${[...unknown].join(", ")}`);
      }
      return assetsItems;
    });
    return items.map((item) => item.file);
  }
  const [banners, cores, ...songAssetsInfo] = await Promise.all([
    checkBannerAssets(),
    checkItemAssets(),
    ...songList.songs.filter((song) => !song.deleted).map(getSongAssets),
  ]);
  /** @type {AssetsInfo} */
  const assetsInfo = {
    songs: songAssetsInfo,
    banners,
    cores,
  };
  await writeJSON(assetsInfoFile.url, assetsInfo);
  console.log(
    songAssetsInfo.filter((a) => {
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
