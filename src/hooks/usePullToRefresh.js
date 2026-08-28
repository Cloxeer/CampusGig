import { useEffect, useRef, useState } from "react";

/** Same breakpoint as the app shell: desktop (≥900px) reloads the tab instead. */
export const PULL_TO_REFRESH_MQ = "(max-width: 899px)";

const THRESHOLD = 56;
const MAX_PULL = 92;
const DAMP = 0.42;
const SLOP = 12;

function damp(raw) {
  return Math.min(MAX_PULL, Math.max(0, raw) * DAMP);
}

function isMobilePtr() {
  return typeof window !== "undefined" && window.matchMedia(PULL_TO_REFRESH_MQ).matches;
}

function atScrollTop(scrollEl) {
  const inner = scrollEl?.scrollTop ?? 0;
  const win = window.scrollY || document.documentElement.scrollTop || 0;
  return inner <= 1 && win <= 1;
}

/**
 * Rubber-band pull from the top of `scrollRef`. Touch on real phones; pointer
 * also works under the mobile breakpoint (narrow window / device emulation).
 */
export function usePullToRefresh({ scrollRef, onRefresh, enabled = true }) {
  const [pullPx, setPullPx] = useState(0);
  const [busy, setBusy] = useState(false);
  const startYRef = useRef(0);
  const trackingRef = useRef(false);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const busyRef = useRef(false);
  const touchGestureRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  busyRef.current = busy;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return undefined;

    function setPull(next) {
      pullRef.current = next;
      setPullPx(next);
    }

    function arm(clientY) {
      if (!isMobilePtr() || !onRefreshRef.current || busyRef.current) return false;
      if (!atScrollTop(el)) return false;
      startYRef.current = clientY;
      trackingRef.current = true;
      pullingRef.current = false;
      return true;
    }

    function move(clientY, prevent) {
      if (!trackingRef.current && !pullingRef.current) return;
      const dy = clientY - startYRef.current;
      if (!pullingRef.current) {
        if (dy < SLOP) return;
        if (!atScrollTop(el)) {
          trackingRef.current = false;
          return;
        }
        pullingRef.current = true;
      }
      if (dy <= 0 || !atScrollTop(el)) {
        if (dy <= 0) setPull(0);
        if (!atScrollTop(el)) {
          pullingRef.current = false;
          trackingRef.current = false;
        }
        return;
      }
      prevent();
      setPull(damp(dy));
    }

    async function finish() {
      trackingRef.current = false;
      touchGestureRef.current = false;
      if (!pullingRef.current) return;
      pullingRef.current = false;
      const distance = pullRef.current;
      if (distance < THRESHOLD || !onRefreshRef.current) {
        setPull(0);
        return;
      }
      setBusy(true);
      setPull(Math.max(distance, 48));
      try {
        await onRefreshRef.current();
      } finally {
        setBusy(false);
        setPull(0);
      }
    }

    function onTouchStart(e) {
      if (!e.touches[0]) return;
      if (arm(e.touches[0].clientY)) touchGestureRef.current = true;
    }

    function onTouchMove(e) {
      if (!touchGestureRef.current || !e.touches[0]) return;
      move(e.touches[0].clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    }

    function onPointerDown(e) {
      if (touchGestureRef.current) return;
      if (e.pointerType === "touch") return;
      arm(e.clientY);
    }

    function onPointerMove(e) {
      if (touchGestureRef.current) return;
      if (e.pointerType === "touch") return;
      move(e.clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", finish);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
    };
  }, [scrollRef, enabled]);

  return { pullPx, busy, armed: pullPx >= THRESHOLD };
}
