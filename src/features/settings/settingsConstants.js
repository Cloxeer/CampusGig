export const DELETE_CONFIRM_PHRASE = "DELETE";

export const APP_VERSION = "1.0.0";

export const SETTINGS_SUPPORT_EMAIL = "support@getcampusgig.com";

/** localStorage keys for device-only notification UI prefs */
export const DEVICE_STORAGE_KEYS = {
  notifyGigUpdates: "cg_settings_notify_gig_updates",
  notifyAlerts: "cg_settings_notify_alerts",
  toastCorner: "cg_settings_toast_corner",
};

/** @typedef {"tl" | "tr" | "bl" | "br"} ToastCorner */
export const TOAST_CORNERS = /** @type {const} */ (["tl", "tr", "bl", "br"]);

export const DEFAULT_TOAST_CORNER = /** @type {const} */ ("br");
