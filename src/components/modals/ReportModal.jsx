import { useState } from "react";
import { X, Loader, Flag, CheckCircle } from "lucide-react";
import { submitReport } from "../../lib/profile";

const REASONS_BASE = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or fake review" },
  { value: "false_info", label: "False information" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

function reasonsForType(subjectType) {
  if (subjectType === "gig") {
    return REASONS_BASE.map((r) =>
      r.value === "spam" ? { ...r, label: "Spam or misleading listing" } : r
    );
  }
  return REASONS_BASE;
}

const COPY = {
  review: {
    title: "Report review",
    subtitle: "Why are you reporting this review?",
  },
  gig: {
    title: "Report gig",
    subtitle: "Why are you reporting this gig listing?",
  },
};

/**
 * Unified report flow for `public.reports` (subject_type `review` | `gig`).
 * Same layout as the original review-only modal; copy changes by subject.
 */
export default function ReportModal({ subjectType, reviewId, gigId, onClose, onReported }) {
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const meta = COPY[subjectType] || COPY.review;
  const reasonRows = reasonsForType(subjectType);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await submitReport({
      subjectType,
      reviewId: subjectType === "review" ? reviewId : undefined,
      gigId: subjectType === "gig" ? gigId : undefined,
      reason: selected,
      details: selected === "other" ? details.trim() || null : null,
    });

    if (err) {
      const msg = err.message || "";
      if (/duplicate|unique|23505/i.test(msg)) {
        setDone(true);
      } else {
        setError(msg || "Something went wrong.");
      }
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDone(true);
    onReported?.();
  }

  return (
    <div className="modal-center-root" onClick={onClose}>
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <CheckCircle size={36} color="var(--green-d)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", marginBottom: 6 }}>
              Report submitted
            </div>
            <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, marginBottom: 20 }}>
              Thanks for helping keep CampusGig safe. We&apos;ll review this shortly.
            </div>
            <button type="button" className="btn bp bfull" style={{ borderRadius: 12, height: 44 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-center-hd">
              <div className="modal-center-hd-title">
                <Flag size={15} color="var(--fg3)" aria-hidden />
                <span>{meta.title}</span>
              </div>
              <button type="button" className="modal-center-close" onClick={onClose} aria-label="Close">
                <X size={13} />
              </button>
            </div>

            <div style={{ padding: "0 20px 4px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, flexShrink: 0 }}>
              {meta.subtitle}
            </div>

            <div className="modal-center-body" style={{ padding: "8px 12px 4px" }}>
              {reasonRows.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelected(r.value)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 10px",
                    border: "none",
                    borderRadius: 10,
                    background: selected === r.value ? "var(--bg3)" : "transparent",
                    cursor: "pointer",
                    transition: "background .12s",
                    fontFamily: "var(--font)",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      border: selected === r.value ? "6px solid var(--ink)" : "2px solid var(--bd2)",
                      flexShrink: 0,
                      transition: "border .12s",
                      boxSizing: "border-box",
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 450, color: "var(--fg)", letterSpacing: "-.01em" }}>
                    {r.label}
                  </span>
                </button>
              ))}

              {selected === "other" && (
                <div style={{ padding: "4px 8px 0" }}>
                  <textarea
                    className="ta"
                    style={{ minHeight: 56, fontSize: 13, borderRadius: 10 }}
                    placeholder="Please describe the issue…"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={500}
                  />
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: "0 20px 8px", fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)" }}>
                {error}
              </div>
            )}

            <div className="modal-center-ft" style={{ paddingTop: 8 }}>
              <button
                type="button"
                className="btn bp bfull"
                style={{
                  borderRadius: 12,
                  height: 44,
                  opacity: !selected || submitting ? 0.5 : 1,
                  background: "var(--err)",
                }}
                disabled={!selected || submitting}
                onClick={handleSubmit}
              >
                {submitting ? <Loader size={14} className="spin" /> : <Flag size={14} />}
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
