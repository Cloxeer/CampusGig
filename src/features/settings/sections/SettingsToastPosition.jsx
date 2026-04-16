import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "../../../components/toast/ToastProvider";
import { TOAST_CORNERS } from "../settingsConstants";
import { useToastCornerPreference } from "../hooks/useToastCornerPreference";

const LABELS = {
  tl: "Top left",
  tr: "Top right",
  bl: "Bottom left",
  br: "Bottom right",
};

const DEMO_TITLE = "Alert banner";
const DEMO_BODY = "Toasts appear here when you have new items in Alerts (preview).";
const DEMO_MS = 4000;

export default function SettingsToastPosition() {
  const [open, setOpen] = useState(true);
  const { corner, setCorner } = useToastCornerPreference();
  const { showToast } = useToast();

  function select(cornerId) {
    setCorner(cornerId);
    showToast({
      title: DEMO_TITLE,
      body: DEMO_BODY,
      corner: cornerId,
      durationMs: DEMO_MS,
      showIcon: true,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 0 6px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
          }}
        >
          Toast position
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--fg3)",
            flexShrink: 0,
          }}
          aria-hidden
        >
          {open ? <ChevronUp size={18} strokeWidth={2.25} /> : <ChevronDown size={18} strokeWidth={2.25} />}
        </span>
      </button>

      {open ? (
        <>
          <p style={{ fontSize: 12, color: "var(--fg3)", lineHeight: 1.45, margin: "0 0 10px" }}>
            Where alert banners slide in on this device. Tap a corner to preview. Tap the Toast position row (chevron ^) to
            hide or show this section.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              maxWidth: 320,
            }}
          >
            {TOAST_CORNERS.map((c) => {
              const selected = corner === c;
              return (
                <button
                  key={c}
                  type="button"
                  className="btn"
                  onClick={() => select(c)}
                  style={{
                    padding: "12px 10px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: "var(--r)",
                    border: selected ? "2px solid var(--green-d)" : "1px solid var(--bd)",
                    background: selected ? "var(--green-bg)" : "var(--bg)",
                    color: "var(--fg)",
                    justifyContent: "center",
                  }}
                >
                  {LABELS[c]}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}
