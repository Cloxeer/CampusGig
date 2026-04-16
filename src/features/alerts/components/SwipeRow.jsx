import { useState, useRef, useCallback } from "react";
import { Trash2, Lock } from "lucide-react";

export default function SwipeRow({ children, canDelete, onDelete }) {
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const THRESHOLD = 72;

  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    swipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      const dx = e.touches[0].clientX - startXRef.current;
      if (dx > 0 && !swiped) return;
      if (Math.abs(dx) > 8) swipingRef.current = true;
      const clamp = Math.max(Math.min(swiped ? dx - THRESHOLD : dx, 0), -THRESHOLD);
      currentXRef.current = clamp;
      setOffset(clamp);
    },
    [swiped]
  );

  const handleTouchEnd = useCallback(() => {
    if (currentXRef.current < -THRESHOLD * 0.5) {
      setOffset(-THRESHOLD);
      setSwiped(true);
    } else {
      setOffset(0);
      setSwiped(false);
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (swipingRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const resetSwipe = useCallback(() => {
    setOffset(0);
    setSwiped(false);
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: THRESHOLD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: canDelete ? "var(--err)" : "var(--bg3)",
          transition: "background .15s",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canDelete) onDelete();
            else resetSwipe();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: canDelete ? "pointer" : "not-allowed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: canDelete ? "white" : "var(--fg4)",
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--mono)",
          }}
        >
          {canDelete ? <Trash2 size={16} /> : <Lock size={14} />}
          {canDelete ? "Delete" : "Active"}
        </button>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--bg)",
          transform: `translateX(${offset}px)`,
          transition: swipingRef.current ? "none" : "transform .2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClick}
      >
        {children}
      </div>
    </div>
  );
}
