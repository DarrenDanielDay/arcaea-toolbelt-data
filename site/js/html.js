import htm from "htm";
import { h } from "hyplate";
/** @type {(templates: TemplateStringsArray, ...args: any[]) => JSX.Element} */
export const html = htm.bind(h);
/**
 * @param {*} v 
 * @returns {string}
 */
export function binding(v) { return v }
