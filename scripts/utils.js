// @ts-check
/// <reference path="./all-types.d.ts" />
import logupdate from "log-update";
import { mkdir, writeFile, open } from "fs/promises";
import { parse, resolve } from "path";
import { cwd } from "process";
import { pathLikeToString, readJSON, relativeTo, writeJSON } from "pragmatism/node";
import { clone, isObjectLike } from "pragmatism";

export { relativeTo };

export { pathLikeToString };

export { readJSON };

export { writeJSON };

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
 * @param {unknown} oldValue
 * @param {unknown} newValue
 * @returns {unknown}
 */
export function patchDeep(oldValue, newValue) {
  if (typeof newValue !== typeof oldValue || Array.isArray(newValue) !== Array.isArray(oldValue)) {
    console.log(`type changed: ${oldValue}(${typeof oldValue}) => ${newValue}(${typeof newValue})`);
    return newValue;
  }
  if (!isObjectLike(newValue)) {
    if (oldValue !== newValue) {
      console.log(`Updated: ${oldValue} => ${newValue}`);
    }
    return newValue;
  }
  if (Array.isArray(newValue) && Array.isArray(oldValue)) {
    if (newValue.length < oldValue.length) {
      console.log(`removed ${oldValue.length - newValue.length} item in array`);
    }
    return newValue.map((item, i) => {
      if (i >= oldValue.length) {
        console.log(`added item ${i}`);
        return item;
      }
      return patchDeep(oldValue[i], item);
    });
  }
  if (isObjectLike(newValue) && isObjectLike(oldValue)) {
    const missingKeys = new Set(Object.keys(oldValue)).difference(new Set(Object.keys(newValue)));
    if (missingKeys.size) {
      console.log(`removed properties: ${[...missingKeys]}`);
    }
    const result = clone(oldValue);
    for (const key in newValue) {
      if (!(key in oldValue)) {
        console.log(`new property: ${key}`);
        Reflect.set(result, key, Reflect.get(newValue, key));
      } else {
        Reflect.set(result, key, patchDeep(Reflect.get(oldValue, key), Reflect.get(newValue, key)));
      }
    }
    return result;
  }
  throw new Error("Impossible");
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
 *
 * @param {string | number | bigint} value
 */
export function formatBigInt(value) {
  const text = `${value}`;
  /** @type {string[]} */
  const buf = [];
  /** @type {number} */
  for (let i = 0; i < text.length; i += 3) {
    buf.push(text.slice(-i - 3, -i || undefined));
  }
  return buf.reverse().join(",");
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
Progress: ${formatBigInt(this.progress)} of ${formatBigInt(this.total)} bytes...
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
  const parentUrl = new URL(".", save.toString());
  await mkdir(parentUrl, { recursive: true });
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

/**
 * @param {number} a
 * @param {number} b
 * @param {number} [delta]
 */
export function isNear(a, b, delta = 1e-4) {
  return Math.abs(a - b) < delta;
}
