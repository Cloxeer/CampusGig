import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/**
 * Instagram-style avatar viewer. The whole circular photo is one object on a
 * dimmed backdrop: pinch (two fingers), double-tap, or scroll scales the entire
 * circle toward you — it grows as a unit, never resizing the photo inside a
 * fixed mask. Drag to pan when zoomed in. Tap the backdrop / ✕ / Esc to close.
 *
 * Portaled to <body> so it escapes any transformed ancestor (which would
 * otherwise trap position:fixed — see repPath/modal footguns).
 *
 * @param {object} props
 * @param {string} props.src - image URL
 * @param {string} [props.alt]
 * @param {() => void} props.onClose
 */
export default function AvatarZoomModal({ src, alt = "", onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="avatar-zoom-root"
      role="dialog"
      aria-modal="true"
      aria-label="Profile photo"
      onClick={onClose}
    >
      <button
        ref={closeBtnRef}
        type="button"
        className="avatar-zoom-close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        centerZoomedOut
        doubleClick={{ mode: "toggle", step: 1.6 }}
        wheel={{ step: 0.14 }}
        pinch={{ step: 5 }}
      >
        <TransformComponent wrapperClass="avatar-zoom-stage" contentClass="avatar-zoom-content">
          {/* Scaling this circular <img> enlarges the whole circle as one unit. */}
          <img
            src={src}
            alt={alt}
            className="avatar-zoom-img"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>,
    document.body
  );
}
