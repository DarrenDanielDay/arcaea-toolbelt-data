// @ts-check
/// <reference path="./all-types.d.ts" />
import logupdate from "log-update";
import { mkdir, readFile, writeFile, open } from "fs/promises";
import { parse, resolve } from "path";
import { cwd } from "process";
import { fileURLToPath } from "url";

/**
 * @param {PathLike} path
 */
export function pathLikeToString(path) {
  if (typeof path === "string") return path;
  if (path instanceof Buffer) return path.toString("utf-8");
  return fileURLToPath(path);
}

/**
 * @param {PathLike} path
 */
export async function readJSON(path) {
  const content = await readFile(path, { encoding: "utf-8" });
  return JSON.parse(content);
}

/**
 * @param {PathLike} path
 * @param {any} json
 */
export async function writeJSON(path, json) {
  await writeFile(path, JSON.stringify(json, undefined, 2), { encoding: "utf-8" });
}

/**
 * @template T
 * @param {JSONResource<T>} resource
 * @param {(json: T) => Promise<T | void> | T | void} change
 */
export async function patchJSON(resource, change) {
  const oldJSON = await resource();
  const newJSON = (await change(oldJSON)) || oldJSON;
  await writeJSON(resource.url, newJSON);
  return newJSON;
}

/**
 *
 * @param {string} subpath
 * @param {Uint8Array | string} content
 */
export async function output(subpath, content) {
  const dist = resolve(cwd(), "outputs", subpath);
  const dir = parse(dist).dir;
  await mkdir(dir, { recursive: true });
  await writeFile(dist, content, { encoding: "utf8" });
}

/**
 * @implements {Transformer<Uint8Array, Uint8Array>}
 */
class DownloadProgressTransformer {
  progress = 0;
  total = 0;

  /**
   * @param {number} total
   */
  constructor(total) {
    this.total = total;
  }

  start() {
    this.progress = 0;
  }
  /**
   * @param {Uint8Array} chunk
   * @param {*} controller
   */
  transform(chunk, controller) {
    this.progress += chunk.length;
    logupdate(`\
Progress: ${this.progress} of ${this.total} bytes...
`);
    controller.enqueue(chunk);
  }
}

/**
 * @implements {WritableStream<Uint8Array>}
 */
class FileWriteStream extends WritableStream {
  /**
   * @param {FileHandle} handle
   */
  constructor(handle) {
    super({
      write: async (chunk, _controller) => {
        await handle.write(chunk);
      },
    });
  }
}

/**
 * @param {string} url
 * @param {PathLike} save
 */
export async function downloadFileWithNode(url, save) {
  const res = await fetch(url);
  const bodyLength = +(res.headers.get("content-length") ?? "");
  if (!bodyLength) {
    console.warn("Invalid content length. Progress may not work.");
  }
  const { body } = res;
  if (!body) throw new Error("Unexpected empty body.");
  const handle = await open(save, "w+");

  try {
    console.log(`Downloading ${url}...`);
    await body
      .pipeThrough(new TransformStream(new DownloadProgressTransformer(bodyLength)))
      .pipeTo(new FileWriteStream(handle));
  } finally {
    await handle.close();
    logupdate.done();
  }
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(item: T) => string | number} selector
 * @returns {{ [key: string | number]: T }}
 */
export function indexBy(arr, selector) {
  /** @type {{ [key: string | number]: T }} */
  const acc = {};
  return arr.reduce((index, item) => {
    index[selector(item)] = item;
    return index;
  }, acc);
}
