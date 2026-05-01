import { useState } from "react";
import { Sparkles, Flag } from "lucide-react";
import ReportModal from "./modals/ReportModal";

/**
 * Friendly empty state when a gig/project link has no backing row (deleted, expired listing, or bad link).
 * Used on `/gigdetails/:id` and browse modals after fetch settles with no gig.
 */
export default function GigNotFoundPanel({ onBack, title = "Gig Details" }) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="topbar">
        <button type="button" className="btn bg-btn bico" onClick={onBack} aria-label="Go back">
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <div style={{ width: 34 }} />
      </div>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div
          style={{
            padding: "28px 20px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "var(--green-bg)",
              border: "1px solid var(--green-bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--green-d)",
              marginBottom: 16,
            }}
            aria-hidden
          >
            <Sparkles size={26} strokeWidth={1.75} />
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-.03em",
              color: "var(--fg)",
              marginBottom: 10,
              lineHeight: 1.25,
            }}
          >
            {"Oops — we can't find this project"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--fg3)",
              lineHeight: 1.55,
              marginBottom: 22,
              fontFamily: "var(--font)",
            }}
          >
            It may have been removed or the link is a little off. Sorry about that! If something seems wrong, you can
            leave a quick report — otherwise, head back and keep exploring campus gigs.
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <button type="button" className="btn bgreen bfull" onClick={onBack}>
              Go back
            </button>
            <button
              type="button"
              className="btn bo bfull"
              onClick={() => setReportOpen(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Flag size={14} strokeWidth={1.75} aria-hidden />
              Report a problem
            </button>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportModal subjectType="SupportReport" onClose={() => setReportOpen(false)} />
      )}
    </>
  );
}
