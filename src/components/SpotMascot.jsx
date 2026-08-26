import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { hasMet, markMet, getContext, nextOpener, nextCloser, EXTRAS } from "../lib/spotMemory";
import "./spotMascot.css";

/*
  SpotMascot — CampusGig's mascot "Spot".

  One shared component, usable anywhere. It renders a single pebble body (dark
  ink) with two light eyes, and drives everything live with one animation loop:
    - idle "breathing" + slow gaze drift            (feels alive at rest)
    - random blinks                                 (and blink-on-mood-change)
    - eyes track a target                           (cursor, a point, or an element)
    - moods swap the eye SHAPE behind a blink        (so expressions never "pop")
    - a whole-body tilt toward whatever he's watching (Wall-E head-lean)

  Body + eye geometry were measured from the bloub avatar exports; only the eyes
  differ between moods (the body path is identical across all of them).

  Props
    mood      one of MOOD keys: "neutral" | "attentive" | "unimpressed" |
              "excited" | "surprised" | "scared" | "suspicious"   (default "neutral")
    show      boolean — fade/pop in when true, fade out when false   (default true)
    float     true = pinned to the viewport corner (overlay); false = sits in the
              page flow, the parent positions it via `style` (absolute inside a
              relative ancestor) so it scrolls with the content   (default true)
    corner    "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"
              or a {top,left,right,bottom} object — used only when float   (default "bottom-right")
    size      px width/height of the mascot                          (default 96)
    lookAt    "cursor" | {x,y} viewport point | null(idle drift)     (default "cursor")
    lookAtRef a React ref to a DOM element to watch (overrides lookAt when set)
    inkColor  body color                                             (default "#0a0a0c")
    eyeColor  eye color                                              (default "#f9f9f9")
    onClick   if given, Spot becomes clickable
    autoSpeak if true, start the script as soon as `show` is true (no first click)
    autoAdvanceMs  while autoSpeak, walk the next script line after this many ms
              (clicking Spot or the bubble still skips ahead)
    ariaLabel accessible label                                      (default "Spot, the CampusGig mascot")
    className extra classes on the root
    style     extra inline style on the root
*/

// ── Geometry ────────────────────────────────────────────────────────────────
// The pebble body — identical in every mood.
const BODY_D =
  "M97.84 0.33C97.35 3.52 96.67 6.68 95.86 9.75C95.05 12.83 94.07 15.85 92.99 18.79C91.9 21.73 90.68 24.59 89.36 27.38C88.04 30.16 86.61 32.87 85.1 35.5C83.58 38.13 81.97 40.67 80.29 43.14C78.61 45.61 76.84 48.01 75 50.32C73.17 52.63 71.25 54.87 69.27 57.03C67.29 59.18 65.24 61.26 63.11 63.26C60.99 65.25 58.79 67.16 56.53 68.98C54.26 70.8 51.92 72.53 49.52 74.16C47.11 75.78 44.63 77.31 42.09 78.72C39.55 80.13 36.93 81.44 34.27 82.61C31.6 83.78 28.87 84.84 26.1 85.75C23.33 86.66 20.5 87.45 17.64 88.09C14.79 88.72 11.89 89.22 8.98 89.57C6.07 89.92 3.12 90.12 0.19 90.18C-2.75 90.24 -5.7 90.15 -8.64 89.92C-11.57 89.69 -14.51 89.31 -17.41 88.81C-20.32 88.3 -23.21 87.65 -26.07 86.88C-28.92 86.11 -31.76 85.2 -34.54 84.18C-37.33 83.16 -40.09 82.01 -42.8 80.75C-45.5 79.49 -48.17 78.11 -50.79 76.62C-53.4 75.13 -55.97 73.53 -58.48 71.82C-60.99 70.1 -63.45 68.28 -65.83 66.35C-68.21 64.41 -70.54 62.37 -72.78 60.21C-75.01 58.05 -77.19 55.78 -79.24 53.4C-81.3 51.02 -83.28 48.52 -85.11 45.92C-86.95 43.32 -88.69 40.6 -90.26 37.79C-91.83 34.99 -93.29 32.06 -94.55 29.07C-95.8 26.07 -96.92 22.97 -97.81 19.82C-98.71 16.68 -99.43 13.44 -99.92 10.19C-100.41 6.94 -100.7 3.62 -100.76 0.33C-100.81 -2.96 -100.65 -6.3 -100.25 -9.56C-99.85 -12.83 -99.22 -16.1 -98.37 -19.27C-97.52 -22.45 -96.43 -25.58 -95.15 -28.59C-93.87 -31.6 -92.36 -34.53 -90.69 -37.31C-89.02 -40.1 -87.14 -42.77 -85.14 -45.28C-83.14 -47.79 -80.95 -50.16 -78.69 -52.37C-76.42 -54.58 -74 -56.63 -71.54 -58.53C-69.07 -60.43 -66.5 -62.17 -63.91 -63.77C-61.32 -65.37 -58.65 -66.8 -56 -68.13C-53.34 -69.46 -50.64 -70.63 -47.96 -71.73C-45.28 -72.82 -42.59 -73.78 -39.91 -74.69C-37.23 -75.59 -34.57 -76.39 -31.91 -77.15C-29.25 -77.91 -26.6 -78.59 -23.95 -79.24C-21.3 -79.89 -18.66 -80.48 -16 -81.04C-13.34 -81.6 -10.68 -82.12 -7.98 -82.6C-5.28 -83.07 -2.57 -83.52 0.19 -83.89C2.95 -84.27 5.74 -84.61 8.58 -84.85C11.42 -85.09 14.3 -85.29 17.23 -85.35C20.16 -85.42 23.14 -85.41 26.14 -85.24C29.15 -85.07 32.21 -84.8 35.26 -84.34C38.31 -83.88 41.4 -83.29 44.46 -82.49C47.51 -81.69 50.58 -80.73 53.57 -79.56C56.55 -78.39 59.53 -77.02 62.38 -75.45C65.23 -73.89 68.03 -72.11 70.67 -70.15C73.3 -68.19 75.84 -66.02 78.19 -63.69C80.54 -61.36 82.75 -58.82 84.74 -56.17C86.73 -53.51 88.55 -50.67 90.14 -47.75C91.73 -44.83 93.12 -41.76 94.28 -38.64C95.44 -35.53 96.37 -32.3 97.09 -29.06C97.8 -25.83 98.29 -22.52 98.57 -19.24C98.85 -15.96 98.91 -12.64 98.79 -9.38C98.67 -6.12 98.33 -2.86 97.84 0.33Z";

// Each mood = the two eye shapes + their resting matrix [a,b,c,d,e,f].
// (Rest matrices are the 0% keyframe from each bloub export — they encode the
// eye's size, tilt and where it sits on the face, which is what sells the mood.)
const MOODS = {
  neutral: {
    eye: "M-9.3 -11.3A9.3 9.3 0 0 1 0 -20.6L0 -20.6A9.3 9.3 0 0 1 9.3 -11.3L9.3 11.3A9.3 9.3 0 0 1 0 20.6L0 20.6A9.3 9.3 0 0 1 -9.3 11.3Z",
    eyeR: "M-9.3 -11.3A9.3 9.3 0 0 1 0 -20.6L0 -20.6A9.3 9.3 0 0 1 9.3 -11.3L9.3 11.3A9.3 9.3 0 0 1 0 20.6L0 20.6A9.3 9.3 0 0 1 -9.3 11.3Z",
    l: [0.86, -0.32, 0.45, 0.84, 20.45, -38.93],
    r: [0.62, -0.05, 0.45, 0.84, 63.36, -52.43],
  },
  attentive: {
    eye: "M-10.5 -11.5A10.5 10.5 0 0 1 0 -22L0 -22A10.5 10.5 0 0 1 10.5 -11.5L10.5 11.5A10.5 10.5 0 0 1 0 22L0 22A10.5 10.5 0 0 1 -10.5 11.5Z",
    eyeR: "M-10.5 -11.5A10.5 10.5 0 0 1 0 -22L0 -22A10.5 10.5 0 0 1 10.5 -11.5L10.5 11.5A10.5 10.5 0 0 1 0 22L0 22A10.5 10.5 0 0 1 -10.5 11.5Z",
    l: [0.98, -0.1, 0.08, 0.99, -14.49, -9.2],
    r: [0.92, -0.03, 0.08, 0.99, 39.86, -13.73],
  },
  unimpressed: {
    eye: "M-15 0A6 6 0 0 1 -9 -6L9 -6A6 6 0 0 1 15 0L15 0A6 6 0 0 1 9 6L-9 6A6 6 0 0 1 -15 0Z",
    eyeR: "M-15 0A6 6 0 0 1 -9 -6L9 -6A6 6 0 0 1 15 0L15 0A6 6 0 0 1 9 6L-9 6A6 6 0 0 1 -15 0Z",
    l: [0.82, -0.02, -0.02, 1, -57.39, -6.64],
    r: [1, 0.02, -0.02, 1, -4.13, -5.72],
  },
  excited: {
    eye: "M-20 -8A20 20 0 0 1 0 -28L0 -28A20 20 0 0 1 20 -8L20 8A20 20 0 0 1 0 28L0 28A20 20 0 0 1 -20 8Z",
    eyeR: "M-20 -8A20 20 0 0 1 0 -28L0 -28A20 20 0 0 1 20 -8L20 8A20 20 0 0 1 0 28L0 28A20 20 0 0 1 -20 8Z",
    l: [0.97, -0.1, 0.14, 0.98, -16.89, 11.34],
    r: [0.86, 0.1, -0.18, 0.98, 43.95, 11.11],
  },
  surprised: {
    eye: "M-22.5 -1A22.5 22.5 0 0 1 0 -23.5L0 -23.5A22.5 22.5 0 0 1 22.5 -1L22.5 1A22.5 22.5 0 0 1 0 23.5L0 23.5A22.5 22.5 0 0 1 -22.5 1Z",
    eyeR: "M-22.5 -1A22.5 22.5 0 0 1 0 -23.5L0 -23.5A22.5 22.5 0 0 1 22.5 -1L22.5 1A22.5 22.5 0 0 1 0 23.5L0 23.5A22.5 22.5 0 0 1 -22.5 1Z",
    l: [0.97, 0, 0, 1, -22.26, 1.78],
    r: [0.91, -0.01, 0, 1, 41.42, 1.72],
  },
  scared: {
    eye: "M-20 -10A20 20 0 0 1 0 -30L0 -30A20 20 0 0 1 20 -10L20 10A20 20 0 0 1 0 30L0 30A20 20 0 0 1 -20 10Z",
    eyeR: "M-20 -10A20 20 0 0 1 0 -30L0 -30A20 20 0 0 1 20 -10L20 10A20 20 0 0 1 0 30L0 30A20 20 0 0 1 -20 10Z",
    l: [0.96, 0.11, -0.03, 0.95, -24.87, 20.67],
    r: [0.9, -0.11, -0.03, 0.95, 38.73, 19.76],
  },
  suspicious: {
    // asymmetric — a tall eye + a squinting side-eye
    eye: "M-10.5 -9.5A10.5 10.5 0 0 1 0 -20L0 -20A10.5 10.5 0 0 1 10.5 -9.5L10.5 9.5A10.5 10.5 0 0 1 0 20L0 20A10.5 10.5 0 0 1 -10.5 9.5Z",
    eyeR: "M-11 0A7.5 7.5 0 0 1 -3.5 -7.5L3.5 -7.5A7.5 7.5 0 0 1 11 0L11 0A7.5 7.5 0 0 1 3.5 7.5L-3.5 7.5A7.5 7.5 0 0 1 -11 0Z",
    l: [0.99, -0.14, 0.14, 0.98, -1.09, -8.6],
    r: [0.85, -0.06, 0.14, 0.98, 52.06, -16.34],
  },
};

const CORNERS = {
  "bottom-right": { bottom: "24px", right: "24px" },
  "bottom-left": { bottom: "24px", left: "24px" },
  "top-right": { top: "84px", right: "24px" },
  "top-left": { top: "84px", left: "24px" },
  center: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
};

let uid = 0;

// tiny helpers
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

export default function SpotMascot({
  mood = "neutral",
  show = true,
  float = true,
  flip = false,
  rotate = 0,
  videoSrc = null,
  corner = "bottom-right",
  size = 96,
  lookAt = "cursor",
  lookAtRef = null,
  inkColor = "#0a0a0c",
  eyeColor = "#f9f9f9",
  onClick = null,
  script = null,
  chatId = null,
  autoSpeak = false,
  autoAdvanceMs = 0,
  bubbleSide = "top",
  onBubbleChange = null,
  ariaLabel = "Spot, the CampusGig mascot",
  className = "",
  style = null,
}) {
  const rootRef = useRef(null);
  const breatheRef = useRef(null);
  const bubbleRef = useRef(null);

  // ── click-to-talk: Spot's memory-backed "arc" ───────────────────────────
  // He introduces himself once (ever), walks a page's hints once, wraps up,
  // then goes quiet — pester him 5× (or reload) for bonus lines. Cross-page
  // memory lives in spotMemory so he stays one coherent character.
  const hasChat = !!(script && chatId);
  const [bubble, setBubble] = useState(null); // { text } | null
  const lastClick = useRef(0);

  const serveExtra = (c) => {
    if (c.ei < EXTRAS.length) {
      setBubble({ text: EXTRAS[c.ei] });
      c.ei += 1;
    } else {
      setBubble(null);
      c.phase = "done"; // out of bonus lines → quiet till reload
    }
  };

  const speak = () => {
    const c = getContext(chatId);
    // compose this context's queue once: [greeting/opener, ...hints, closer]
    if (!c.queue) {
      const met = hasMet();
      const first = met ? nextOpener() : script.intro;
      if (!met) markMet(); // first meeting anywhere → he now knows you
      const closer = script.closer || nextCloser();
      c.queue = [first, ...(script.hints || []), closer].filter(Boolean);
    }
    switch (c.phase) {
      case "script":
        setBubble({ text: c.queue[c.i] });
        c.i += 1;
        if (c.i >= c.queue.length) c.phase = "await-dismiss";
        break;
      case "await-dismiss": // closer already shown → this click just clicks off
        setBubble(null);
        c.phase = "resting";
        c.restClicks = 0;
        break;
      case "resting": // quiet; pester 5× to wake him for bonus lines
        setBubble(null);
        c.restClicks += 1;
        if (c.restClicks >= 5) {
          c.phase = "extras";
          c.ei = 0;
          serveExtra(c);
        }
        break;
      case "extras":
        serveExtra(c);
        break;
      default: // "done"
        setBubble(null);
    }
  };

  const handleTalkClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClick.current < 300) return; // ignore accidental double-fires
    lastClick.current = now;
    if (hasChat) speak();
    if (onClick) onClick(e);
  };

  const speakRef = useRef(speak);
  speakRef.current = speak;

  // Tutorial mode: open the first line when he pops in; restore the current
  // line if the tree remounts mid-script (session memory already advanced).
  useEffect(() => {
    if (!autoSpeak || !show || !hasChat) return;
    const c = getContext(chatId);
    if (c.phase === "script" && c.i === 0 && !c.autoStarted) {
      c.autoStarted = true;
      speakRef.current();
    } else if (c.queue && c.phase === "script" && c.i > 0) {
      setBubble({ text: c.queue[c.i - 1] });
    } else if (c.queue && c.phase === "await-dismiss") {
      setBubble({ text: c.queue[c.queue.length - 1] });
    }
  }, [autoSpeak, show, hasChat, chatId]);

  // Auto-walk the rest of the script; a click (new bubble) resets this wait.
  useEffect(() => {
    if (!autoSpeak || !show || !hasChat || !autoAdvanceMs || !bubble) return undefined;
    const c = getContext(chatId);
    if (c.phase !== "script" && c.phase !== "await-dismiss") return undefined;
    const t = setTimeout(() => speakRef.current(), autoAdvanceMs);
    return () => clearTimeout(t);
  }, [autoSpeak, show, hasChat, autoAdvanceMs, chatId, bubble]);

  // let the parent pause any movement while Spot is talking
  useEffect(() => {
    if (onBubbleChange) onBubbleChange(!!bubble);
  }, [bubble, onBubbleChange]);

  // if Spot pops out (slide change / hop), drop any open bubble
  useEffect(() => {
    if (!show) setBubble(null);
  }, [show]);

  // click-away / Escape closes the bubble (the bubble lives in a portal, so
  // exclude it too — clicking the bubble itself shouldn't dismiss it).
  // Tutorial autoSpeak keeps the bubble until the script walks off.
  useEffect(() => {
    if (!bubble) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setBubble(null);
    };
    document.addEventListener("keydown", onKey);
    if (autoSpeak) {
      return () => document.removeEventListener("keydown", onKey);
    }
    const onDown = (e) => {
      const inRoot = rootRef.current && rootRef.current.contains(e.target);
      const inBubble = bubbleRef.current && bubbleRef.current.contains(e.target);
      if (!inRoot && !inBubble) setBubble(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onDown, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [bubble, autoSpeak]);

  // Comic-book positioning: the bubble is portaled to <body> and fixed-
  // positioned from Spot's live rect, so no ancestor can clip it. It picks the
  // side with more room and clamps to the viewport, while the tail stays pinned
  // under Spot (left / centre / right — wherever he is).
  useLayoutEffect(() => {
    if (!bubble) return undefined;
    const place = () => {
      const rootEl = rootRef.current;
      const b = bubbleRef.current;
      if (!rootEl || !b) return;
      const r = rootEl.getBoundingClientRect();
      const bw = b.offsetWidth;
      const bh = b.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const gap = 10;
      const m = 8;
      const cx = r.left + r.width / 2;
      // horizontal: centre on Spot, clamp inside the viewport
      const left = Math.max(m, Math.min(cx - bw / 2, vw - m - bw));
      // vertical: keep preferred side unless there isn't room, then flip
      let side = bubbleSide === "bottom" ? "bottom" : "top";
      const above = r.top;
      const below = vh - r.bottom;
      if (side === "top" && above < bh + gap + m && below > above) side = "bottom";
      else if (side === "bottom" && below < bh + gap + m && above > below) side = "top";
      let top = side === "top" ? r.top - gap - bh : r.bottom + gap;
      top = Math.max(m, Math.min(top, vh - m - bh));
      b.style.left = `${left}px`;
      b.style.top = `${top}px`;
      b.dataset.side = side;
      const tailX = Math.max(16, Math.min(cx - left, bw - 16));
      b.style.setProperty("--tail-x", `${tailX}px`);
    };
    // Track Spot every frame so the tail stays glued to him even if he shifts.
    let raf = requestAnimationFrame(function loop() {
      place();
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [bubble, bubbleSide]);
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);
  const maskId = useRef(`spot-mask-${uid++}`).current;

  // Live values the loop reads without re-rendering. Refs so prop changes don't
  // restart the animation.
  const state = useRef({
    // current (eased) rest matrices actually shown
    curL: [...MOODS.neutral.l],
    curR: [...MOODS.neutral.r],
    // target matrices (jump-swapped at blink-closed)
    tgtL: [...MOODS.neutral.l],
    tgtR: [...MOODS.neutral.r],
    renderedMood: "neutral",
    pendingMood: "neutral",
    gx: 0,
    gy: 0,
    tilt: 0,
    blink: 1, // 1 = open, ~0 = closed
    blinking: false,
    blinkStart: 0,
    nextBlink: 800,
    lookAt,
    lookAtRef,
    flip,
    rotate: (rotate * Math.PI) / 180, // base head tilt, radians
  }).current;

  const mouse = useRef({ x: -9999, y: -9999 });

  // keep loop-visible props in sync without restarting rAF
  useEffect(() => {
    state.lookAt = lookAt;
    state.lookAtRef = lookAtRef;
    state.flip = flip;
    state.rotate = (rotate * Math.PI) / 180;
  }, [lookAt, lookAtRef, flip, rotate, state]);

  useEffect(() => {
    state.pendingMood = MOODS[mood] ? mood : "neutral";
    // trigger a blink so the shape swaps while the eyes are shut
    if (state.pendingMood !== state.renderedMood && !state.blinking) {
      state.blinking = true;
      state.blinkStart = performance.now();
    }
  }, [mood, state]);

  // apply mood shape to the DOM immediately (used at blink-closed)
  const applyMood = (m) => {
    const M = MOODS[m];
    if (!M) return;
    if (eyeLRef.current) eyeLRef.current.setAttribute("d", M.eye);
    if (eyeRRef.current) eyeRRef.current.setAttribute("d", M.eyeR);
    state.tgtL = [...M.l];
    state.tgtR = [...M.r];
    // jump the current matrices too — eyes are shut, so it's invisible
    state.curL = [...M.l];
    state.curR = [...M.r];
    state.renderedMood = m;
  };

  // paint the mood shape whenever we're in SVG mode (also re-applies when
  // switching back from the video clip to the live SVG).
  useLayoutEffect(() => {
    if (!videoSrc) applyMood(MOODS[mood] ? mood : "neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc]);

  useEffect(() => {
    // In video mode there are no eyes to drive — the clip animates itself.
    if (videoSrc) return undefined;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const t = now / 1000;
      const s = state;

      // ── where is Spot on screen? (his eye centre, roughly) ──
      let cx = 0,
        cy = 0;
      const rootEl = rootRef.current;
      if (rootEl) {
        const rect = rootEl.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height * 0.42; // eyes sit above centre
      }

      // ── decide the gaze target ──
      let tx = null,
        ty = null;
      const ref = s.lookAtRef && s.lookAtRef.current;
      if (ref) {
        const r = ref.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      } else if (s.lookAt === "cursor") {
        if (mouse.current.x > -9998) {
          tx = mouse.current.x;
          ty = mouse.current.y;
        }
      } else if (s.lookAt && typeof s.lookAt === "object") {
        tx = s.lookAt.x;
        ty = s.lookAt.y;
      }

      // desired gaze offset (in view-box units) + a subtle head tilt
      let dgx = 0,
        dgy = 0,
        dtilt = 0;
      if (tx != null && !reduce) {
        const dx = tx - cx;
        const dy = ty - cy;
        dgx = clamp(dx / 26, -9, 9);
        dgy = clamp(dy / 26, -7, 7);
        dtilt = clamp(dx / 2600, -0.05, 0.05);
      } else if (!reduce) {
        // idle drift — a slow wander so he never looks frozen
        dgx = Math.sin(t * 0.55) * 3.2 + Math.sin(t * 0.23) * 1.6;
        dgy = Math.cos(t * 0.4) * 2.2;
        dtilt = Math.sin(t * 0.3) * 0.015;
      }
      const ease = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
      s.gx = lerp(s.gx, dgx, ease);
      s.gy = lerp(s.gy, dgy, ease);
      s.tilt = lerp(s.tilt, dtilt, ease);

      // ── blink (scheduled + on mood change) ──
      if (!reduce && !s.blinking && now >= s.nextBlink) {
        s.blinking = true;
        s.blinkStart = now;
      }
      if (s.blinking) {
        const bt = now - s.blinkStart;
        const CLOSE = 80,
          OPEN = 110,
          TOTAL = CLOSE + OPEN;
        if (bt < CLOSE) {
          s.blink = 1 - bt / CLOSE;
        } else if (bt < TOTAL) {
          // at the fully-closed instant, swap in any pending mood
          if (s.pendingMood !== s.renderedMood) applyMood(s.pendingMood);
          s.blink = (bt - CLOSE) / OPEN;
        } else {
          s.blink = 1;
          s.blinking = false;
          s.nextBlink = now + 2200 + Math.random() * 3600;
        }
      } else if (reduce) {
        s.blink = 1;
      }

      // ── ease current matrices toward target (mostly a no-op since we jump
      //    at blink-closed, but keeps gaze-independent drift smooth) ──
      for (let i = 0; i < 6; i++) {
        s.curL[i] = lerp(s.curL[i], s.tgtL[i], ease);
        s.curR[i] = lerp(s.curR[i], s.tgtR[i], ease);
      }

      // ── write eye transforms ──
      const sy = 0.08 + 0.92 * s.blink; // never fully zero → keeps a hairline
      // when the whole SVG is mirrored (facing left), flip the horizontal gaze
      // so the eyes still move toward the real on-screen target.
      const gx = s.flip ? -s.gx : s.gx;
      if (eyeLRef.current) {
        const m = s.curL;
        eyeLRef.current.style.transform = `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${
          m[4] + gx
        },${m[5] + s.gy}) scaleY(${sy})`;
      }
      if (eyeRRef.current) {
        const m = s.curR;
        eyeRRef.current.style.transform = `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${
          m[4] + gx
        },${m[5] + s.gy}) scaleY(${sy})`;
      }

      // ── breathing + head tilt on the wrapper (base rotate + live gaze tilt) ──
      if (breatheRef.current) {
        const breath = reduce ? 1 : 1 + Math.sin(t * 1.7) * 0.02;
        const bob = reduce ? 0 : Math.sin(t * 1.7) * 1.2;
        breatheRef.current.style.transform = `translateY(${bob}px) scale(${breath}) rotate(${
          s.rotate + s.tilt
        }rad)`;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc]);

  // float:true → pinned to the viewport at a corner (overlay).
  // float:false → sits in the page flow; the parent positions it (absolute
  // inside a relative ancestor) via `style`, so it scrolls with the content.
  const posStyle = float
    ? typeof corner === "object"
      ? corner
      : CORNERS[corner] || CORNERS["bottom-right"]
    : { position: "absolute" };

  const interactive = hasChat || !!onClick;

  return (
    <div
      ref={rootRef}
      className={`spot-root ${float ? "" : "spot-static"} ${interactive ? "spot-clickable" : ""} ${className}`}
      data-show={show ? "true" : "false"}
      style={{ ...posStyle, ...style }}
      aria-label={ariaLabel}
    >
      {bubble
        ? createPortal(
            <div
              ref={bubbleRef}
              className="spot-bubble"
              role="status"
              aria-live="polite"
              onClick={hasChat ? handleTalkClick : undefined}
              style={hasChat ? { cursor: "pointer" } : undefined}
            >
              {bubble.text}
            </div>,
            document.body
          )
        : null}
      <div
        ref={breatheRef}
        className="spot-breathe"
        onClick={interactive ? handleTalkClick : undefined}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? "Talk to Spot" : ariaLabel}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTalkClick(e);
                }
              }
            : undefined
        }
      >
        {videoSrc ? (
          // Pre-rendered clip. The white backdrop is dropped via multiply so
          // only Spot shows on the light card. Scaled up a touch so his body
          // matches the live SVG's size (the clip has padding around him).
          <video
            className="spot-video"
            width={size}
            height={size}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            style={{
              display: "block",
              transform: `scale(1.32)${flip ? " scaleX(-1)" : ""}`,
              mixBlendMode: "multiply",
            }}
          />
        ) : (
        <svg
          className="spot-svg"
          width={size}
          height={size}
          viewBox="-125 -125 250 250"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={flip ? { transform: "scaleX(-1)" } : undefined}
        >
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="-158"
              y="-158"
              width="316"
              height="316"
            >
              {/* white = body shows; black eyes = holes that reveal the light body beneath */}
              <path d={BODY_D} fill="#fff" />
              <path ref={eyeLRef} className="spot-eye" d={MOODS.neutral.eye} fill="#000" />
              <path ref={eyeRRef} className="spot-eye" d={MOODS.neutral.eyeR} fill="#000" />
            </mask>
          </defs>

          {/* soft contact shadow */}
          <ellipse
            className="spot-shadow"
            cx="0"
            cy="104"
            rx="70"
            ry="12"
            fill="rgba(0,0,0,0.16)"
          />

          {/* light body underneath (becomes the eyes where the mask punches holes) */}
          <path d={BODY_D} fill={eyeColor} />
          {/* dark ink body, with eye holes cut by the mask */}
          <g mask={`url(#${maskId})`}>
            <rect x="-158" y="-158" width="316" height="316" fill={inkColor} />
          </g>
        </svg>
        )}
      </div>
    </div>
  );
}
