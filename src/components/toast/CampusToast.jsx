import { useEffect, useRef, useState } from "react";
import { BellRing } from "lucide-react";
import { toastAnchorStyle, toastInitialTransform, toastProgressOrigin } from "./toastGeometry";

/**
 * @param {{
 *   title: string,
 *   body?: string,
 *   corner: import("./toastGeometry").ToastCorner,
 *   durationMs: number,
 *   onDismissComplete: () => void,
 *   showIcon?: boolean,
 * }} props
 */
export default function CampusToast({
  title,
  body = "",
  corner,
  durationMs,
  onDismissComplete,
  showIcon = true,
}) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const progressDoneRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const initial = toastInitialTransform(corner);
  const slideTransform = exiting || !entered ? initial : "translate(0, 0)";

  function handleProgressEnd() {
    if (progressDoneRef.current) return;
    progressDoneRef.current = true;
    setExiting(true);
  }

  function handleTransitionEnd(e) {
    if (!exiting) return;
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform" && e.propertyName !== "opacity") return;
    onDismissComplete();
  }

  const anchor = toastAnchorStyle(corner);
  const origin = toastProgressOrigin(corner);

  return (
    <div
      className="campus-toast-host"
      style={{
        position: "fixed",
        zIndex: 200,
        maxWidth: "min(400px, calc(100vw - 32px))",
        pointerEvents: "auto",
        ...anchor,
        transform: reducedMotion ? undefined : slideTransform,
        opacity: reducedMotion ? (exiting ? 0 : entered ? 1 : 0) : 1,
        transition: reducedMotion
          ? "opacity 0.22s ease"
          : "transform 0.22s ease, opacity 0.22s ease",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className="campus-toast"
        role="status"
        aria-live="polite"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r)",
          boxShadow: "0 8px 28px rgba(0,0,0,.08), 0 0 0 0.5px rgba(0,0,0,.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 3,
            overflow: "hidden",
            borderRadius: "var(--r) var(--r) 0 0",
            background: "var(--bg3)",
          }}
        >
          <div
            className="campus-toast-progress"
            style={{
              height: "100%",
              width: "100%",
              background: "var(--green-d)",
              transformOrigin: origin,
              ["--toast-duration"]: `${durationMs}ms`,
            }}
            onAnimationEnd={handleProgressEnd}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px" }}>
          {showIcon ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--r)",
                background: "var(--bg3)",
                border: "1px solid var(--bd)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg3)",
                flexShrink: 0,
              }}
            >
              <BellRing size={17} aria-hidden />
            </div>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{title}</div>
            {body ? (
              <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 2, lineHeight: 1.35 }}>{body}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
