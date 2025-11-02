/**
 * @param {object} module
 * @returns {any}
 */
export function jsonModule(module) {
  if ("default" in module) return module.default;
  return module;
}
