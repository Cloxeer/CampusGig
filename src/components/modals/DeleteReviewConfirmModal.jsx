import { useState } from "react";
import { X, Loader, Trash2 } from "lucide-react";
import { deleteMyReview } from "../../lib/profile";

/**
 * Same shell as ReportReviewModal (modal-center-root / hd / body / ft).
 */
export default function DeleteReviewConfirmModal({ reviewId, gigTitle, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    if (!reviewId) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await deleteMyReview(reviewId);
    setSubmitting(false);
    if (err) {
      setError(typeof err.message === "string" ? err.message : "Could not delete review.");
      return;
    }
    onDeleted?.();
    onClose();
  }

  const gigLine = gigTitle ? `“${String(gigTitle).slice(0, 80)}${String(gigTitle).length > 80 ? "…" : ""}”` : "this gig";

  return (
    <div className="modal-center-root" onClick={onClose}>
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-center-hd">
          <div className="modal-center-hd-title">
            <Trash2 size={15} color="var(--fg3)" aria-hidden />
            <span>Delete review</span>
          </div>
          <button type="button" className="modal-center-close" onClick={onClose} aria-label="Close">
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: "0 20px 4px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, flexShrink: 0 }}>
          This removes your review for {gigLine}. The other person&apos;s rep score will be updated. This can&apos;t be undone.
        </div>

        <div className="modal-center-body" style={{ padding: "8px 20px 12px", fontSize: 13, color: "var(--fg2)", lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>
            Only your review for this gig is removed. Everyone else&apos;s reviews stay as they are.
          </p>
        </div>

        {error ? (
          <div style={{ padding: "0 20px 8px", fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)" }}>{error}</div>
        ) : null}

        <div className="modal-center-ft" style={{ paddingTop: 8, display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn bo bfull"
            style={{ flex: 1, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn bp bfull"
            style={{
              flex: 1,
              borderRadius: 12,
              height: 44,
              opacity: submitting ? 0.6 : 1,
              background: "var(--err)",
            }}
            disabled={submitting}
            onClick={handleDelete}
          >
            {submitting ? <Loader size={14} className="spin" /> : <Trash2 size={14} />}
            {submitting ? "Deleting…" : "Delete review"}
          </button>
        </div>
      </div>
    </div>
  );
}
