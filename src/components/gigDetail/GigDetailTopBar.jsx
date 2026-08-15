import { Flag } from "lucide-react";

export default function GigDetailTopBar({
  onClose,
  canReport,
  onReport,
  canPosterDelete,
  gigId,
  onEdit,
  onDelete,
  deleting,
}) {
  return (
    <div className="topbar">
      <button type="button" className="btn bg-btn bico" onClick={onClose}>
        <span style={{ fontSize: 15 }}>←</span>
      </button>
      <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Gig Details</span>
      {canReport ? (
        <button
          type="button"
          className="rev-flag"
          aria-label="Report gig"
          onClick={onReport}
          style={{ flexShrink: 0 }}
        >
          <Flag size={13} strokeWidth={1.75} />
        </button>
      ) : canPosterDelete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            className="btn bg-btn bsm"
            onClick={() => onEdit(gigId)}
            style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px" }}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn bg-btn bsm"
            onClick={onDelete}
            disabled={deleting}
            style={{
              color: "var(--err)",
              borderColor: "var(--err)",
              background: "transparent",
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 10px",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      ) : (
        <div style={{ width: 34 }} />
      )}
    </div>
  );
}
