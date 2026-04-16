export function readBool(key, defaultVal) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    return v === "1";
  } catch {
    return defaultVal;
  }
}

export function writeBool(key, val) {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {
    /* ignore */
  }
}
