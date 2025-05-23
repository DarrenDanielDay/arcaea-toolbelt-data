import { CachedHttpGetClient } from "@arcaea-toolbelt/services/cache";
import { CACHE_EXPIRE_TIME } from "./shared";

export const htmlDocument = document.implementation.createHTMLDocument();

export function prepareDocument(page: string, url: string | URL) {
  htmlDocument.open();
  htmlDocument.write(page);
  htmlDocument.close();
  const base = htmlDocument.createElement("base");
  base.href = new URL(url).origin;
  htmlDocument.head.appendChild(base);
}

export async function initPageDocument(url: string | URL, client: CachedHttpGetClient) {
  // 默认缓存
  const response = await client.fetch(url, undefined, CACHE_EXPIRE_TIME);
  // wiki页面http status有问题时，清除产生的缓存
  if (response.status.toString().startsWith("5")) {
    await arcaeaCNClient.invalidateCache(url);
  }
  const page = await response.text();
  prepareDocument(page, url);
}

export const wikiBaseURL = new URL("https://wiki.arcaea.cn");

export const pathName = (path: string): string => new URL(path, location.origin).pathname;

export const wikiURL = (path: string) => new URL(pathName(path), wikiBaseURL);

export function findNextElWhere<T extends Element>(start: Element, where: (el: Element) => el is T): T | null;
export function findNextElWhere(start: Element, where: (el: Element) => boolean): Element | null;
export function findNextElWhere(start: Element, where: (el: Element) => boolean): Element | null {
  let node: Element | null = start;
  for (; node && !where(node); node = node.nextElementSibling) {
    if (node.firstElementChild) {
      const child = findNextElWhere(node.firstElementChild, where);
      if (child) {
        return child;
      }
    }
  }
  return node;
}

export function findParentWhere<T extends Element>(start: Element, where: (el: Element) => el is T): T | null {
  let node: Element | null = start;
  for (; node && !where(node); node = node.parentElement);
  return node;
}

export function findLastContentful(node: Node) {
  return Array.from(node.childNodes).findLast(n => !!n.textContent?.trim());
}

export function isAscii(char: string) {
  const charCode = char.charCodeAt(0);
  return 0 < charCode && charCode <= 0x7f;
}

export function filterNonAscii(str: string) {
  return [...str].filter(isAscii).join("");
}

export const arcaeaCNClient = new CachedHttpGetClient("arcaea-cn-cache");
Object.assign(window, { arcaeaCNClient });
