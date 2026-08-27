export const DELETE_CONFIRM_PHRASE = "DELETE";

import pkg from "../../../package.json";

/** Product version — same field as package.json (not a 1.0 launch). */
export const APP_VERSION = pkg.version;

export { COMMUNITY_DISCORD_INVITE_URL, DISCORD_SUPPORT_USERNAME } from "../../utils/supportCommunity";

/** localStorage keys for device-only notification UI prefs */
export const DEVICE_STORAGE_KEYS = {
  notifyGigUpdates: "cg_settings_notify_gig_updates",
  notifyAlerts: "cg_settings_notify_alerts",
  toastCorner: "cg_settings_toast_corner",
};

/** @typedef {"tl" | "tr" | "bl" | "br"} ToastCorner */
export const TOAST_CORNERS = /** @type {const} */ (["tl", "tr", "bl", "br"]);

export const DEFAULT_TOAST_CORNER = /** @type {const} */ ("br");
