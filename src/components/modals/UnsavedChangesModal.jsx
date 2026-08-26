import { X } from "lucide-react";

export default function UnsavedChangesModal({ onStay, onLeave }) {
  return (
    <div
      className="modal-center-root"
      onClick={onStay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-center-hd">
          <div className="modal-center-hd-title">
            <span id="unsaved-changes-title">Unsaved changes</span>
          </div>
          <button type="button" className="modal-center-close" onClick={onStay} aria-label="Continue editing">
            <X size={13} />
          </button>
        </div>

        <div className="modal-center-body" style={{ padding: "0 20px 8px", fontSize: 14, color: "var(--fg2)", lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>
            You have changes that have not been saved. If you leave now, those edits will be discarded. Stay on this
            page and tap Save to keep them.
          </p>
        </div>

        <div className="modal-center-ft" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            className="btn bp bfull"
            style={{ borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
            onClick={onStay}
          >
            Continue editing
          </button>
          <button
            type="button"
            className="btn bo bfull"
            style={{ borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
            onClick={onLeave}
          >
            Leave without saving
          </button>
        </div>
      </div>
    </div>
  );
}
