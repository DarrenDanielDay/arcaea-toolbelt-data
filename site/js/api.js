/**
 * fetch static json data
 * @param {string} path
 * @returns {any}
 */
export async function staticJSON(path) {
  const res = await fetch(path);
  const data = await res.json();
  return data;
}
