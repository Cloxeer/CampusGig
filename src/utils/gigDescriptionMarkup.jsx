import { Fragment, createElement } from "react";

/** Paired delimiters; inner segments recurse so nested &B/&I/&U pairs work. */
const PAIRS = [
  { token: "&B", wrap: "strong", style: { fontWeight: 700 } },
  { token: "&I", wrap: "em", style: { fontStyle: "italic" } },
  { token: "&U", wrap: "span", style: { textDecoration: "underline" } },
];

/** `&` + letter (B/I/U), both cases — used for open and close. */
function delimiterForms(pair) {
  const letter = pair.token[1];
  const upper = `&${letter.toUpperCase()}`;
  const lower = `&${letter.toLowerCase()}`;
  return upper === lower ? [upper] : [upper, lower];
}

/** Rich text / email clients sometimes store `&amp;B` instead of `&B`. */
function normalizeMarkupSource(s) {
  return String(s).replace(/&amp;([BIU])/gi, (_, ch) => `&${ch.toUpperCase()}`);
}

/** Earliest opening delimiter among B/I/U (case-insensitive on the letter). */
function findEarliestOpen(s, from) {
  let best = null;
  for (const p of PAIRS) {
    for (const open of delimiterForms(p)) {
      const idx = s.indexOf(open, from);
      if (idx < 0) continue;
      const better =
        !best ||
        idx < best.index ||
        (idx === best.index && PAIRS.indexOf(p) < PAIRS.indexOf(best.pair));
      if (better) best = { index: idx, pair: p, openLen: open.length };
    }
  }
  return best;
}

function findCloseIdx(s, innerStart, pair) {
  let best = -1;
  for (const close of delimiterForms(pair)) {
    const j = s.indexOf(close, innerStart);
    if (j >= 0 && (best < 0 || j < best)) best = j;
  }
  return best;
}

function parseToNodes(s, keyPrefix) {
  const nodes = [];
  let i = 0;
  let seq = 0;

  while (i < s.length) {
    const hit = findEarliestOpen(s, i);
    if (!hit) {
      if (i < s.length) nodes.push(s.slice(i));
      break;
    }
    if (hit.index > i) {
      nodes.push(s.slice(i, hit.index));
    }
    const { pair, openLen } = hit;
    const innerStart = hit.index + openLen;
    const closeIdx = findCloseIdx(s, innerStart, pair);
    if (closeIdx < 0) {
      nodes.push(s.slice(hit.index));
      break;
    }
    const inner = s.slice(innerStart, closeIdx);
    const innerChildren = parseToNodes(inner, `${keyPrefix}-${seq}`);
    seq += 1;
    const key = `${keyPrefix}-n${seq}`;
    const kids = innerChildren.length > 0 ? innerChildren : [""];
    nodes.push(createElement(pair.wrap, { key, style: pair.style }, ...kids));
    i = closeIdx + openLen;
  }

  return nodes;
}

/**
 * Renders gig description with &B…&B bold, &I…&I italic, &U…&U underline. Plain text stays escaped via React.
 * Use inside a container with whiteSpace: "pre-wrap".
 */
export function renderGigDescription(text) {
  if (text == null || text === "") return null;
  const s = normalizeMarkupSource(text);
  const children = parseToNodes(s, "gd");
  if (children.length === 0) return null;
  if (children.length === 1 && typeof children[0] === "string") return children[0];
  return createElement(Fragment, null, ...children);
}
