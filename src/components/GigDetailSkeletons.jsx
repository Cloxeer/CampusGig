/**
 * Skeleton UI for gig detail page.
 */

export function GigDetailSkeleton({ onClose }) {
  return (
    <div className="page fadein">
      <div className="topbar">
        <button type="button" className="btn bg-btn bico" onClick={onClose}>
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Gig Details</span>
        <div style={{ width: 34 }} />
      </div>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div className="skel" style={{ width: 56, height: 22, borderRadius: 4 }} />
            <div className="skel" style={{ width: 120, height: 26, borderRadius: 20 }} />
          </div>
          <div className="skel" style={{ width: "88%", height: 18, marginBottom: 8, borderRadius: 4 }} />
          <div className="skel" style={{ width: 100, height: 28, borderRadius: 4 }} />
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="skel" style={{ width: 32, height: 32, borderRadius: "var(--r)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ width: 72, height: 10, marginBottom: 4, borderRadius: 3 }} />
                <div className="skel" style={{ width: "100%", height: 14, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skel" style={{ width: "100%", height: 48, borderRadius: "var(--r)" }} />
          <div className="skel" style={{ width: "100%", height: 44, borderRadius: "var(--r)" }} />
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
