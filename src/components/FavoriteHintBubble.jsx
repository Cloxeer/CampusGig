import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const EXIT_FALLBACK_MS = 520;

/**
 * Anchored speech bubble (white surface, black type, downward caret).
 * Soft ease-in / ease-out — calm, informative (not urgent).
 */
export default function FavoriteHintBubble({ open, message, anchorRect, onDismiss }) {
  const [snapshot, setSnapshot] = useState(null);
  const [show, setShow] = useState(false);
  const [leave, setLeave] = useState(false);
  const exitFallbackTimerRef = useRef(null);

  const finishExit = useCallback(() => {
    if (exitFallbackTimerRef.current) {
      clearTimeout(exitFallbackTimerRef.current);
      exitFallbackTimerRef.current = null;
    }
    setShow(false);
    setLeave(false);
    setSnapshot(null);
  }, []);

  useEffect(() => {
    if (open && anchorRect) {
      setSnapshot({ message, anchorRect });
      setLeave(false);
      setShow(true);
    }
  }, [open, anchorRect, message]);

  useEffect(() => {
    if (!open && show && !leave) {
      setLeave(true);
    }
  }, [open, show, leave]);

  useEffect(() => {
    if (!leave) return;
    exitFallbackTimerRef.current = setTimeout(finishExit, EXIT_FALLBACK_MS);
    return () => {
      if (exitFallbackTimerRef.current) {
        clearTimeout(exitFallbackTimerRef.current);
        exitFallbackTimerRef.current = null;
      }
    };
  }, [leave, finishExit]);

  const handleBubbleAnimationEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!leave) return;
    const name = e.animationName || "";
    if (name.includes("EaseIn") || name.includes("InReduced")) return;
    finishExit();
  };

  useEffect(() => {
    if (!show || !snapshot) return;
    const dismiss = () => onDismiss?.();
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [show, snapshot, onDismiss]);

  if (!show || !snapshot || typeof document === "undefined") return null;

  const cx = snapshot.anchorRect.left + snapshot.anchorRect.width / 2;
  const starTop = snapshot.anchorRect.top;

  return createPortal(
    <div className="fav-hint-layer" aria-live="polite">
      <div
        className={`fav-hint-bubble${leave ? " fav-hint-bubble--leave" : ""}`}
        role="tooltip"
        style={{
          left: `${cx}px`,
          top: `${starTop}px`,
        }}
        onAnimationEnd={handleBubbleAnimationEnd}
      >
        <div className="fav-hint-bubble-surface">{snapshot.message}</div>
        <div className="fav-hint-bubble-caret" aria-hidden />
      </div>
    </div>,
    document.body
  );
}
