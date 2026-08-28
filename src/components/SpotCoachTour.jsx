import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import SpotMascot from "./SpotMascot";
import { getContext } from "../lib/spotMemory";
import {
  SPOT_COACH_ADVANCE_MS,
  SPOT_COACH_HOP_MS,
  SPOT_COACH_SIZE,
  scriptFromCoachSteps,
} from "../data/spotGigContactTour";

function faceTarget(el, pos, size, host) {
  if (!el || typeof pos.left !== "number") return false;
  const originLeft = host ? host.getBoundingClientRect().left : 0;
  const spotCx = originLeft + pos.left + size / 2;
  const r = el.getBoundingClientRect();
  return spotCx > r.left + r.width / 2;
}

function scrollIfNeeded(el) {
  if (!el) return;
  const scroller = el.closest(".scroll");
  if (!scroller) return;
  const r = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  let delta = 0;
  if (r.top < sr.top + 20) delta = r.top - sr.top - 20;
  else if (r.bottom > sr.bottom - 20) delta = r.bottom - sr.bottom + 20;
  if (delta) scroller.scrollTop += delta;
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function appFrameRect() {
  const el = document.querySelector(".shell-view") || document.querySelector(".nav-layout") || document.querySelector(".page");
  if (el) return el.getBoundingClientRect();
  return {
    left: 0,
    top: 0,
    right: document.documentElement.clientWidth,
    bottom: document.documentElement.clientHeight,
  };
}

function cornerInside(host, el, size, gazeEl) {
  const hr = host.getBoundingClientRect();
  const m = 8;
  const pinRight = Math.max(m, hr.width - size - 4);
  if (!el) return { top: 72, left: pinRight };
  const r = el.getBoundingClientRect();
  const gr = (gazeEl || el).getBoundingClientRect();
  const besideRight = r.right - hr.left + m;
  const besideLeft = r.left - hr.left - size - m;
  const wide = r.width > hr.width * 0.55;
  let left;
  if (wide) {
    left = pinRight;
  } else if (besideRight + size <= hr.width - m) {
    left = besideRight;
  } else if (besideLeft >= m) {
    left = besideLeft;
  } else {
    left = pinRight;
  }
  // Eyes sit at ~42% of Spot's height (see SpotMascot). Line that up with
  // the value so he looks straight at it instead of up.
  let top = gr.top - hr.top + gr.height / 2 - size * 0.42;
  top = Math.max(56, Math.min(top, hr.height - size - 72));
  return { top, left };
}

function cornerBeside(el, size) {
  const fr = appFrameRect();
  const m = 8;
  const nav = 88;
  const minLeft = fr.left + m;
  const maxLeft = fr.right - m - size;
  const minTop = fr.top + 56;
  const maxTop = fr.bottom - m - size - 64;
  if (!el) return { top: Math.max(minTop, fr.bottom - nav - size), left: Math.max(minLeft, maxLeft) };
  const r = el.getBoundingClientRect();
  const roomLeft = r.left - fr.left >= size + m * 2;
  const roomRight = fr.right - r.right >= size + m * 2;
  let left;
  if (roomLeft) left = r.left - size - m;
  else if (roomRight) left = r.right + m;
  else left = Math.max(minLeft, Math.min(r.left + m, maxLeft));
  let top = r.top + r.height / 2 - size / 2;
  left = Math.max(minLeft, Math.min(left, maxLeft));
  top = Math.max(minTop, Math.min(top, maxTop));
  return { top, left };
}

/**
 * One Spot coach: autoSpeak + tap-through (existing mascot), hops to each step's
 * target. Do not copy this hop into other pages — import this brick.
 */
export default function SpotCoachTour({ enabled, chatId, steps, size = SPOT_COACH_SIZE, hostRef: hostEl = null }) {
  const [line, setLine] = useState(0);
  const [show, setShow] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [corner, setCorner] = useState({ bottom: 20, right: 16 });
  const [faceLeft, setFaceLeft] = useState(false);
  const lookAtRef = useRef(null);
  const highlighted = useRef(null);
  const hopFromKey = useRef(null);
  const hopAt = useRef(0);
  const hopGen = useRef(0);
  const stepRef = useRef(null);
  const dismissedRef = useRef(false);

  const beginExit = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    hopGen.current += 1;
    highlighted.current?.classList.remove("spot-tour-target");
    highlighted.current = null;
    setShow(false);
    setDismissed(true);
  };

  const script = useMemo(() => scriptFromCoachSteps(steps), [steps]);
  const stepIndex = steps.length ? Math.min(line, steps.length - 1) : 0;
  const step = steps[stepIndex] || null;
  const stepKey = step?.key || null;
  stepRef.current = step;

  useEffect(() => {
    dismissedRef.current = false;
    setDismissed(false);
    setLine(0);
    setShow(true);
    hopFromKey.current = null;
    hopAt.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    hopGen.current += 1;
  }, [chatId]);

  const lookAtUser = line >= steps.length;

  useLayoutEffect(() => {
    if (!enabled || dismissed || !stepKey) {
      highlighted.current?.classList.remove("spot-tour-target");
      highlighted.current = null;
      return undefined;
    }

    const place = () => {
      const current = stepRef.current;
      const el = typeof current?.getEl === "function" ? current.getEl() : null;
      const gaze = el?.querySelector?.(".gig-detail-contact-row__val") || el;
      lookAtRef.current = lookAtUser ? null : gaze;
      if (lookAtUser) {
        highlighted.current?.classList.remove("spot-tour-target");
        highlighted.current = null;
        return;
      }
      if (highlighted.current && highlighted.current !== el) {
        highlighted.current.classList.remove("spot-tour-target");
      }
      if (el) {
        el.classList.add("spot-tour-target");
        highlighted.current = el;
        const host = hostEl?.current;
        const pos = host ? cornerInside(host, el, size, gaze) : cornerBeside(el, size);
        setCorner(pos);
        setFaceLeft(faceTarget(el, pos, size, host));
      }
    };

    place();

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [enabled, dismissed, stepKey, size, line, hostEl, lookAtUser]);

  useEffect(() => {
    if (!enabled || dismissed || !stepKey) return undefined;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const current = stepRef.current;
      const el = typeof current?.getEl === "function" ? current.getEl() : null;
      scrollIfNeeded(el);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [enabled, dismissed, stepKey]);

  useEffect(() => {
    if (!enabled || dismissed) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      getContext(chatId).phase = "resting";
      beginExit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, dismissed, chatId]);

  useEffect(() => {
    return () => {
      highlighted.current?.classList.remove("spot-tour-target");
      highlighted.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || dismissed || dismissedRef.current || !stepKey) return undefined;
    if (hopFromKey.current == null) {
      hopFromKey.current = stepKey;
      return undefined;
    }
    if (hopFromKey.current === stepKey) return undefined;
    hopFromKey.current = stepKey;
    if (prefersReducedMotion()) return undefined;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    // Rapid skip: jump in place. Hiding him drops click handlers and can
    // leave the tour half-exited if the hop timer loses the race with dismiss.
    if (now - hopAt.current < SPOT_COACH_HOP_MS + 80) {
      hopAt.current = now;
      return undefined;
    }
    hopAt.current = now;
    const gen = ++hopGen.current;
    setShow(false);
    const t = setTimeout(() => {
      if (gen !== hopGen.current || dismissedRef.current) return;
      setShow(true);
    }, SPOT_COACH_HOP_MS);
    return () => clearTimeout(t);
  }, [enabled, dismissed, stepKey]);

  if (!enabled || dismissed || !script || !step) return null;

  return (
    <SpotMascot
      key={chatId}
      float={!hostEl}
      show={show}
      size={size}
      mood={step.mood || "attentive"}
      flip={faceLeft}
      corner={hostEl ? undefined : corner}
      lookAtRef={lookAtUser ? undefined : lookAtRef}
      lookAt={lookAtUser ? "camera" : "cursor"}
      script={script}
      chatId={chatId}
      autoSpeak
      autoAdvanceMs={SPOT_COACH_ADVANCE_MS}
      advanceOnPageClick
      bubbleSide="top"
      bubbleAlign={faceLeft ? "end" : "center"}
      compactBubble
      style={hostEl ? { ...corner, zIndex: 8 } : undefined}
      onLineChange={(index, phase) => {
        setLine(index);
        if (phase === "resting" || phase === "done") beginExit();
      }}
      onBubbleChange={(open) => {
        if (open) return;
        const phase = getContext(chatId).phase;
        if (phase === "resting" || phase === "done") beginExit();
      }}
    />
  );
}
