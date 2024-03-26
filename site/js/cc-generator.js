// @ts-check
/// <reference path="../../scripts/all-types.d.ts" />

import { AutoRender, element, jsxRef, nil, signal } from "hyplate";
import { binding, html } from "./html.js";
import { jsonModule } from "../../shared/esm.js";
const assetsBase = "https://moyoez.github.io/ArcaeaResource-ActionUpdater/arcaea/assets";

/**
 * @returns {Promise<SongList>}
 */
async function getActionUpdaterSlst() {
  const res = await fetch(`${assetsBase}/songs/songlist`);
  return res.json();
}

/**
 * @param {File } file
 */
async function readFileAsJSON(file) {
  try {
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

/**
 * @param {number} ratingClass
 */
function difficulty(ratingClass) {
  return ["pst", "prs", "ftr", "byd", "etr"][ratingClass].toUpperCase();
}
/**
 * @param {DifficultyChart} chart
 */
function level(chart) {
  return `${chart.rating}${chart.ratingPlus ? "+" : ""}`;
}

/** @type {import("hyplate/types").FC} */
export const ChartConstantGenerator = () => {
  const form = element("form");
  const slstFile = element("input");
  const oldCCFile = element("input");
  const jsonDiffs = element("textarea");
  /** @type {import("hyplate/types").WritableSignal<ConstantChartJSONGenerateContext | null>} */
  const ccTestContext = signal(null);
  /** @type {import("hyplate/types").Later<HTMLDivElement>} */
  const newChartsContainerRef = jsxRef();
  async function generateFillTable() {
    if (!form.reportValidity()) {
      return;
    }
    let file = slstFile.files?.item(0);
    /** @type {SongList | null} */
    const slst = file ? await readFileAsJSON(file) : await getActionUpdaterSlst();
    if (slst == null) {
      alert("songlist无效");
      return;
    }
    file = oldCCFile.files?.item(0);
    /** @type {WikiChartConstantJSON | null} */
    const oldCC = file
      ? await readFileAsJSON(file)
      : jsonModule(await import("../../shared/ChartConstant.json", { assert: { type: "json" } }));
    if (oldCC == null) {
      alert("ChartConstant.json无效");
      return;
    }
    ccTestContext.set({
      items: slst.songs
        .flatMap((song) => song.difficulties.map((chart) => ({ song, chart })))
        .filter(({ chart, song }) => {
          const oldC = oldCC[song.id];
          if (oldC == null) {
            // 整首曲目是新的
            return true;
          }
          if (song.id === "lasteternity" && chart.ratingClass !== /** Beyond */ 3) {
            // 不存在实际谱面
            return false;
          }
          // 新难度（BTD/ETR）
          return !oldC[chart.ratingClass];
        }),
      slst,
      oldCC,
    });
  }
  async function generateNewJSON() {
    const ctx = ccTestContext();
    if (!ctx) return;
    const { slst, oldCC, items } = ctx;
    const container = newChartsContainerRef.current;
    if (!container) return;
    const newCC = structuredClone(oldCC);
    const ccs = Array.from(container.querySelectorAll("div.record input"), (input) => input.value);
    /** @type {WikiChartConstantJSON} */
    const newCCPatch = {};
    for (const [i, cc] of ccs.entries()) {
      const { chart, song } = items[i];
      const cclist = (newCCPatch[song.id] ??= Array.from({ length: 5 }, () => null));
      cclist[chart.ratingClass] =
        cc === ""
          ? null // 没填的为null
          : {
              constant: +cc,
              old: false,
            };
    }
    for (const song of slst.songs) {
      newCC[song.id] = Array.from({ length: 5 }, (_, difficulty) => {
        const constant = newCCPatch[song.id]?.[difficulty]?.constant ?? oldCC[song.id]?.[difficulty]?.constant ?? null;
        if (constant == null) return null;
        return {
          constant,
          old: false,
        };
      });
    }
    jsonDiffs.value = JSON.stringify(newCC, undefined, 4);
  }
  return html`<div class="m-3">
    <form ref=${binding(form)} onsubmit="return false">
      <div class="input-group mb-3">
        <label for="use-slst-file" class="input-group-text">songlist</label>
        <input
          ref=${binding(slstFile)}
          id="slst-file"
          name="slst-file"
          type="file"
          class="form-control"
        />
        <div class="input-group-text">不选择文件时使用<a href="https://github.com/MoYoez/ArcaeaResource-ActionUpdater/blob/main/arcaea/assets/songs/songlist">ActionUpdater的songlist</a>（每8小时更新一次）</div>
      </div>
      <div class="input-group mb-3">
        <label for="old-cc-file" class="input-group-text">ChartConstant.json</label>
        <input ref=${binding(oldCCFile)} id="old-cc-file" name="old-cc-file" type="file" class="form-control"  />
        <div class="input-group-text">不选择文件时使用<a href="https://github.com/DarrenDanielDay/arcaea-toolbelt-data/blob/main/shared/ChartConstant.json">arcaea-toolbelt-data的ChartConstant.json</a></div>
      </div>
      <div class="mb-3">
        <button class="btn btn-primary" type="button" onClick=${generateFillTable}>生成填表</button>
      </div>
      <${AutoRender}>${() => {
    const ctx = ccTestContext();
    if (!ctx) {
      return nil;
    }
    const { items } = ctx;
    return html`<div ref=${binding(newChartsContainerRef)} class="new-charts-container my-3">
      <div class="my-3">
        <button class="btn btn-primary" onClick=${generateNewJSON}>生成更新JSON</button>
      </div>
      <div class="header">
        <div>曲绘</div>
        <div>ID</div>
        <div>难度</div>
        <div>曲名</div>
        <div>定数</div>
      </div>
      ${items.map(({ song, chart }) => {
        const filename = chart.jacketOverride ? `${chart.ratingClass}.jpg` : `base.jpg`;
        const folder = song.remote_dl ? `songs/dl_${song.id}` : `songs/${song.id}`;
        const prefixes = ["1080_"];
        const covers = prefixes
          .map((prefix) => `${assetsBase}/${folder}/${prefix}${filename}`)
          .flat()
          .join(" ");
        return html`<div class="record" var:cover-color=${`var(--diff-${chart.ratingClass})`}>
          <div class="cover">
            <img srcset=${covers} />
          </div>
          <div>${song.id}</div>
          <div>${`${difficulty(chart.ratingClass)}${level(chart)}`}</div>
          <div>${song.title_localized["zh-Hans"] ?? song.title_localized.en}</div>
          <div>
            <input type="number" class="form-control" step="0.1" />
          </div>
        </div>`;
      })}
      <div class="my-3">
        <button class="btn btn-primary" onClick=${generateNewJSON}>生成更新JSON</button>
      </div>
      <div class="my-3">
        <textarea id="ccjson" ref=${binding(jsonDiffs)} rows="12"></textarea>
      </div>
    </div>`;
  }}</${AutoRender}>
    </form>
  </div>`;
};
