import { DEFAULT_TOAST_CORNER, TOAST_CORNERS } from "./settingsConstants";

/** @param {string | null | undefined} v */
function isValidCorner(v) {
  return typeof v === "string" && TOAST_CORNERS.includes(/** @type {any} */ (v));
}

/**
 * @param {string} key
 * @returns {import("./settingsConstants").ToastCorner}
 */
export function readToastCorner(key) {
  try {
    const v = localStorage.getItem(key);
    if (isValidCorner(v)) return /** @type {import("./settingsConstants").ToastCorner} */ (v);
  } catch {
    /* ignore */
  }
  return DEFAULT_TOAST_CORNER;
}

/**
 * @param {string} key
 * @param {import("./settingsConstants").ToastCorner} corner
 */
export function writeToastCorner(key, corner) {
  if (!isValidCorner(corner)) return;
  try {
    localStorage.setItem(key, corner);
  } catch {
    /* ignore */
  }
}
