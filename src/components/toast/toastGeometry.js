/** @typedef {"tl" | "tr" | "bl" | "br"} ToastCorner */

/** @param {ToastCorner} corner */
export function toastProgressOrigin(corner) {
  return corner === "tl" || corner === "bl" ? "left" : "right";
}

/** @param {ToastCorner} corner */
export function toastAnchorStyle(corner) {
  const padH = 16;
  const padTop = 32; // slightly below safe top edge
  const padBottom = 32; // slightly above safe bottom edge
  switch (corner) {
    case "tl":
      return { top: padTop, left: padH, right: "auto", bottom: "auto" };
    case "tr":
      return { top: padTop, right: padH, left: "auto", bottom: "auto" };
    case "bl":
      return { bottom: padBottom, left: padH, right: "auto", top: "auto" };
    case "br":
    default:
      return { bottom: padBottom, right: padH, left: "auto", top: "auto" };
  }
}

/** Off-screen transform before enter / after exit. @param {ToastCorner} corner */
export function toastInitialTransform(corner) {
  switch (corner) {
    case "tl":
      return "translate(-120%, -12px)";
    case "tr":
      return "translate(120%, -12px)";
    case "bl":
      return "translate(-120%, 12px)";
    case "br":
    default:
      return "translate(120%, 12px)";
  }
}
