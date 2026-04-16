import { Trash2, AlertTriangle } from "lucide-react";
import { SETTINGS_SUPPORT_EMAIL } from "../settingsConstants";

export default function SettingsDangerZone({
  isPendingDeletion,
  graceEndsLabel,
  onOpenDeleteModal,
}) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--fg3)",
          fontFamily: "var(--mono)",
          padding: "20px 0 6px",
        }}
      >
        Danger zone
      </div>

      {isPendingDeletion ? (
        <div
          style={{
            background: "var(--err-bg)",
            border: "1px solid #fecaca",
            borderRadius: "var(--r)",
            padding: "14px 14px",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={18} color="#b91c1c" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>
                Account deletion scheduled
              </div>
              <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.5 }}>
                Your data is set to be removed after{" "}
                <strong style={{ fontFamily: "var(--mono)" }}>{graceEndsLabel}</strong> (about 15 days from when you
                requested). <strong>To cancel:</strong> This will sign you out. After you sign in again with your{" "}
                <strong>@nmsu.edu</strong> magic link, a fresh sign-in clears this schedule automatically. If you delete
                again later, you'll go through the full delete flow from scratch.
                Stuck? Email <strong>{SETTINGS_SUPPORT_EMAIL}</strong>.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="btn"
        onClick={() => {
          if (isPendingDeletion) return;
          onOpenDeleteModal();
        }}
        disabled={isPendingDeletion}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 16px",
          border: "2px solid #dc2626",
          borderRadius: "var(--r)",
          background: "#fef2f2",
          fontSize: 14,
          fontWeight: 700,
          color: "#b91c1c",
          cursor: isPendingDeletion ? "not-allowed" : "pointer",
          opacity: isPendingDeletion ? 0.55 : 1,
          gap: 8,
        }}
      >
        <Trash2 size={18} strokeWidth={2.25} />
        Delete account
      </button>
    </>
  );
}
