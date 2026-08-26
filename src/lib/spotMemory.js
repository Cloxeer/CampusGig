/**
 * Spot's memory — shared by every place he appears so he stays one coherent,
 * smart character site-wide.
 *
 *  - `metYou` is persisted (localStorage), so he introduces himself ONCE, ever,
 *    and never re-greets you — even after a reload.
 *  - Per-context delivery progress lives in memory only, so it survives SPA
 *    navigation between pages (he remembers what he already said) but a real
 *    page reload clears it, letting him run a page's lines again (without a
 *    re-introduction).
 */

const MET_KEY = "spot.met.v1";

export function hasMet() {
  try {
    return localStorage.getItem(MET_KEY) === "1";
  } catch {
    return false;
  }
}

export function markMet() {
  try {
    localStorage.setItem(MET_KEY, "1");
  } catch {
    /* ignore (private mode etc.) */
  }
}

/**
 * Per-context state machine record. phase:
 *   "script"        → walking intro/opener → hints → closer (once)
 *   "await-dismiss" → closer shown; next click just clicks off
 *   "resting"       → quiet; counting pesters toward re-engage
 *   "extras"        → serving bonus personality lines
 *   "done"          → fully quiet until reload
 */
const contexts = new Map();

export function getContext(id) {
  let c = contexts.get(id);
  if (!c) {
    c = { phase: "script", i: 0, restClicks: 0, ei: 0, queue: null };
    contexts.set(id, c);
  }
  return c;
}

// ── Spot's voice, shared everywhere ─────────────────────────────────────────
// Continuation openers used once he's already met you (so later pages read as
// "he's still talking to me", not a fresh greeting).
export const OPENERS = ["Back to it—", "Okay, here:", "So, this page:", "Quick one:", "Right, next:"];
// Wrap-ups that signal he's done for now.
export const CLOSERS = ["That's the gist.", "You're set.", "Easy, right?", "Go get 'em.", "I'll stick around."];
// Bonus lines when you pester him after he's finished (his personality).
export const EXTRAS = [
  "You again? I like it.",
  "Okay okay, I'm flattered.",
  "That's all I've got, honest.",
  "...still clicking, huh.",
  "Go make some rep already.",
];

// Deterministic rotation (not random) so openers/closers vary page to page but
// stay testable. Counters reset on reload with the rest of the session state.
let openerN = 0;
let closerN = 0;
export function nextOpener() {
  return OPENERS[openerN++ % OPENERS.length];
}
export function nextCloser() {
  return CLOSERS[closerN++ % CLOSERS.length];
}
