import { Fragment, createElement } from "react";

/** Paired delimiters; inner segments recurse so nested &B/&I/&U pairs work. */
const PAIRS = [
  { token: "&B", wrap: "strong", style: undefined },
  { token: "&I", wrap: "em", style: undefined },
  { token: "&U", wrap: "span", style: { textDecoration: "underline" } },
];

function findEarliestPairStart(s, from) {
  let bestIdx = -1;
  let pair = null;
  for (const p of PAIRS) {
    const i = s.indexOf(p.token, from);
    if (i >= 0 && (bestIdx < 0 || i < bestIdx)) {
      bestIdx = i;
      pair = p;
    }
  }
  return bestIdx >= 0 ? { index: bestIdx, pair } : null;
}

function parseToNodes(s, keyPrefix) {
  const nodes = [];
  let i = 0;
  let seq = 0;

  while (i < s.length) {
    const hit = findEarliestPairStart(s, i);
    if (!hit) {
      if (i < s.length) nodes.push(s.slice(i));
      break;
    }
    if (hit.index > i) {
      nodes.push(s.slice(i, hit.index));
    }
    const { pair } = hit;
    const innerStart = hit.index + pair.token.length;
    const closeIdx = s.indexOf(pair.token, innerStart);
    if (closeIdx < 0) {
      nodes.push(s.slice(hit.index));
      break;
    }
    const inner = s.slice(innerStart, closeIdx);
    const innerChildren = parseToNodes(inner, `${keyPrefix}-${seq}`);
    seq += 1;
    const key = `${keyPrefix}-n${seq}`;
    nodes.push(
      createElement(pair.wrap, { key, style: pair.style }, innerChildren.length ? innerChildren : null),
    );
    i = closeIdx + pair.token.length;
  }

  return nodes;
}

/**
 * Renders gig description with &B…&B bold, &I…&I italic, &U…&U underline. Plain text stays escaped via React.
 * Use inside a container with whiteSpace: "pre-wrap".
 */
export function renderGigDescription(text) {
  if (text == null || text === "") return null;
  const s = String(text);
  const children = parseToNodes(s, "gd");
  if (children.length === 0) return null;
  if (children.length === 1 && typeof children[0] === "string") return children[0];
  return createElement(Fragment, null, ...children);
}
