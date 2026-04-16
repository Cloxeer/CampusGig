import { Loader, Trash2, X } from "lucide-react";
import { DELETE_CONFIRM_PHRASE } from "./settingsConstants";

export default function DeleteAccountModal({
  onBackdropClick,
  onClose,
  deleteConfirmInput,
  onDeleteConfirmInputChange,
  deleteError,
  deleteConfirmMatches,
  deleteSubmitting,
  onConfirmDelete,
}) {
  return (
    <div className="modal-center-root" onClick={onBackdropClick}>
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-center-hd">
          <div className="modal-center-hd-title">
            <Trash2 size={15} color="#b91c1c" aria-hidden />
            <span style={{ color: "#991b1b" }}>Delete your account</span>
          </div>
          <button type="button" className="modal-center-close" onClick={onClose} aria-label="Close">
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: "0 20px 8px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.45, flexShrink: 0 }}>
          This cannot be undone after the grace period.
        </div>

        <div className="modal-center-body" style={{ padding: "8px 20px 12px", fontSize: 13, color: "var(--fg2)", lineHeight: 1.55 }}>
          <p style={{ margin: "0 0 10px" }}>
            <strong>What gets removed:</strong> Profile, rep, reviews, gigs, alerts, and activity — everything tied to your
            account on GetCampusGig.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            <strong>Scheduling, not instant:</strong> Tapping the button below schedules deletion. Your account stays usable
            until after the 15-day grace period.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            <strong>How to cancel:</strong> This will sign you out. After you sign in again with your @nmsu.edu magic link, a
            fresh sign-in clears the scheduled deletion.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Graduated / lost email:</strong> If you can no longer receive a magic link at @nmsu.edu, we cannot verify
            ownership — treat deletion as final.
          </p>
        </div>

        <div className="modal-center-ft" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="lbl" style={{ fontSize: 11 }}>
              Type <strong style={{ color: "#b91c1c" }}>{DELETE_CONFIRM_PHRASE}</strong> to confirm
            </label>
            <input
              className="inp"
              value={deleteConfirmInput}
              onChange={(e) => onDeleteConfirmInputChange(e.target.value)}
              placeholder={DELETE_CONFIRM_PHRASE}
              autoComplete="off"
              autoCapitalize="characters"
              style={{ marginTop: 6, borderRadius: 10 }}
            />
            {deleteError ? (
              <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 6 }}>
                {deleteError}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn bo bfull"
              onClick={onClose}
              style={{ flex: 1, minHeight: 44, fontSize: 14, fontWeight: 600, borderRadius: 12 }}
            >
              Keep account
            </button>
            <button
              type="button"
              className="btn bfull"
              disabled={!deleteConfirmMatches() || deleteSubmitting}
              onClick={onConfirmDelete}
              style={{
                flex: 1,
                minHeight: 44,
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: 12,
                border: deleteConfirmMatches() && !deleteSubmitting ? "1px solid #b91c1c" : "1px solid var(--bd)",
                background: deleteConfirmMatches() && !deleteSubmitting ? "#dc2626" : "var(--bg3)",
                color: deleteConfirmMatches() && !deleteSubmitting ? "#fff" : "var(--fg4)",
                cursor: !deleteConfirmMatches() || deleteSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {deleteSubmitting ? <Loader size={15} className="spin" /> : <Trash2 size={15} strokeWidth={2.25} />}
              {deleteSubmitting ? "…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
