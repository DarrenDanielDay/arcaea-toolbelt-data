// @ts-check
/// <reference path="../../scripts/all-types.d.ts" />

import { AutoRender, element, jsxRef, nil, signal } from "hyplate";
import { binding, html } from "./html.js";
import { jsonModule } from "../../shared/esm.js";

const assetsBase = process.env.ASSETS_VENDOR || "/assets";
const difficultyCount = 5;

/**
 * @returns {Promise<SongList>}
 */
async function getVendorSlst() {
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
 * @param {object} obj
 */
function toJSON(obj) {
  return JSON.stringify(obj, undefined, 2);
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

  /**
   * @param {ClipboardEvent} e
   */
  function handlePaste(e) {
    const { target, clipboardData } = e;
    if (!(target instanceof HTMLInputElement) || !clipboardData) {
      return;
    }
    const { current: panel } = newChartsContainerRef;
    if (!panel) {
      return;
    }
    const inputs = [...panel.querySelectorAll(`input${[...target.classList].map((c) => `.${c}`).join("")}`)].filter(
      (e) => e instanceof HTMLInputElement
    );
    const index = inputs.indexOf(target);
    if (index < 0) {
      return;
    }
    const text = clipboardData.getData("text");
    console.log(inputs);
    const fills = text
      .split(/\s|\n/g)
      .map((x) => x.trim())
      .filter(Boolean);
    let pasted = false;
    for (let i = 0; i < fills.length; i++) {
      const fill = fills[i];
      const input = inputs[index + i];
      if (input) {
        input.value = fill;
        pasted = true;
      }
    }
    if (pasted) {
      e.preventDefault();
    }
  }
  /**
   * @param {HTMLDivElement} container
   */
  function getFilledChartConstants(container) {
    return Array.from(container.querySelectorAll("div.record input.constant"), (input) => input.value);
  }

  /**
   * @param {HTMLDivElement} container
   */
  function getFilledNotes(container) {
    return Array.from(container.querySelectorAll("div.record input.notes"), (input) => input.value);
  }
  /**
   * @param {string} text
   */
  function generateText(text) {
    jsonDiffs.value = text;
    jsonDiffs.focus();
    jsonDiffs.select();
  }
  async function generateFillTable() {
    if (!form.reportValidity()) {
      return;
    }
    let file = slstFile.files?.item(0);
    /** @type {SongList | null} */
    const slst = file ? await readFileAsJSON(file) : await getVendorSlst();
    if (slst == null) {
      alert("songlist无效");
      return;
    }
    file = oldCCFile.files?.item(0);
    /** @type {WikiChartConstantJSON | null} */
    const oldCC = file
      ? await readFileAsJSON(file)
      : jsonModule(await import("../../src/data/ChartConstant.json", { assert: { type: "json" } }));
    const oldNotes = jsonModule(await import("../../src/data/notes-and-constants.json", { assert: { type: "json" } }));
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
      oldNotes,
    });
  }
  async function generateChartConstantsJSON() {
    const ctx = ccTestContext();
    if (!ctx) return;
    const { slst, oldCC, items } = ctx;
    const container = newChartsContainerRef.current;
    if (!container) return;
    const newCC = structuredClone(oldCC);
    const filledCCs = getFilledChartConstants(container);
    /** @type {WikiChartConstantJSON} */
    const newCCPatch = {};
    for (const [i, cc] of filledCCs.entries()) {
      const { chart, song } = items[i];
      const cclist = (newCCPatch[song.id] ??= Array.from({ length: difficultyCount }, () => null));
      cclist[chart.ratingClass] =
        cc === ""
          ? null // 没填的为null
          : {
              constant: +cc,
              old: false,
            };
    }
    for (const song of slst.songs) {
      newCC[song.id] = Array.from({ length: difficultyCount }, (_, difficulty) => {
        const constant = newCCPatch[song.id]?.[difficulty]?.constant ?? oldCC[song.id]?.[difficulty]?.constant ?? null;
        if (constant == null) return null;
        return {
          constant,
          old: false,
        };
      });
    }

    generateText(toJSON(newCC));
  }

  async function generateNotesAndConstantsJSON() {
    const ctx = ccTestContext();
    if (!ctx) return;
    const { oldNotes, items } = ctx;
    const newNotes = structuredClone(oldNotes);
    const container = newChartsContainerRef.current;
    if (!container) return;
    const filledCCs = getFilledChartConstants(container);
    const notes = getFilledNotes(container);
    for (const [i, cc] of filledCCs.entries()) {
      const { song, chart } = items[i];
      const charts =
        newNotes.find((x) => x.id === song.id)?.charts ||
        (() => {
          /** @type {ExtraSongData['charts']} */
          const newCharts = Array.from({ length: difficultyCount }, () => null);
          newNotes.push({
            id: song.id,
            charts: newCharts,
          });
          return newCharts;
        })();
      charts[chart.ratingClass] = {
        notes: +notes[i] || 0,
        constant: +cc || 0,
      };
    }
    generateText(toJSON(newNotes));
  }

  async function generateChartExpress() {
    const ctx = ccTestContext();
    if (!ctx) return;
    const { items } = ctx;
    const container = newChartsContainerRef.current;
    if (!container) return;
    /** @type {Record<string, ChartExpress>} */
    const songs = {};
    for (const [i, cc] of getFilledChartConstants(container).entries()) {
      const { song, chart } = items[i];
      const filledSong = (songs[song.id] ??= {
        songId: song.id,
        charts: Array.from({ length: difficultyCount }, () => null),
      });
      filledSong.charts[chart.ratingClass] =
        cc === ""
          ? null
          : {
              constant: +cc,
            };
    }
    generateText(toJSON(Object.values(songs)));
  }

  return html`<div class="m-3" onPaste=${handlePaste}>
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
        <div class="input-group-text">不选择文件时使用<a target="_blank" href="${
          process.env.ASSETS_VENDOR + ""
        }">供应商的songlist</a>（每8小时更新一次）</div>
      </div>
      <div class="input-group mb-3">
        <label for="old-cc-file" class="input-group-text">ChartConstant.json</label>
        <input ref=${binding(oldCCFile)} id="old-cc-file" name="old-cc-file" type="file" class="form-control"  />
        <div class="input-group-text">不选择文件时使用<a href="https://github.com/DarrenDanielDay/arcaea-toolbelt-data/blob/main/src/data/ChartConstant.json">arcaea-toolbelt-data的ChartConstant.json</a></div>
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
        <button class="btn btn-primary" onClick=${generateChartConstantsJSON}>生成ChartConstants.json</button>
      </div>
      <div class="header">
        <div>曲绘</div>
        <div>ID</div>
        <div>难度</div>
        <div>曲名</div>
        <div>定数</div>
        <div>物量</div>
      </div>
      ${items.map(({ song, chart }) => {
        const filename = chart.jacketOverride ? `${chart.ratingClass}` : `base`;
        const folder = song.remote_dl ? `songs/dl_${song.id}` : `songs/${song.id}`;
        const prefixes = ["1080_"];
        const covers = prefixes
          .flatMap((prefix) =>
            ["_256.jpg", ".jpg"].map((suffix) => `${assetsBase}/${folder}/${prefix}${filename}${suffix}`)
          )
          .flat()
          .join(", ");
        return html`<div class="record" var:cover-color=${`var(--diff-${chart.ratingClass})`}>
          <div class="cover">
            <img srcset=${covers} />
          </div>
          <div>${song.id}</div>
          <div>${`${difficulty(chart.ratingClass)}${level(chart)}`}</div>
          <div>${song.title_localized["zh-Hans"] ?? song.title_localized.en}</div>
          <div>
            <input type="number" class="form-control constant" step="0.1" />
          </div>
          <div>
            <input type="number" class="form-control notes" step="1" />
          </div>
        </div>`;
      })}
      <div class="my-3">
        <button class="btn btn-primary me-3" onClick=${generateChartConstantsJSON}>生成ChartConstants.json</button>
        <button class="btn btn-primary me-3" onClick=${generateNotesAndConstantsJSON}>
          生成notes-and-constants.json
        </button>
        <button class="btn btn-primary me-3" onClick=${generateChartExpress}>生成chart-express.json</button>
      </div>
      <div class="my-3">
        <textarea id="ccjson" ref=${binding(jsonDiffs)} rows="12"></textarea>
      </div>
    </div>`;
  }}</${AutoRender}>
    </form>
  </div>`;
};
