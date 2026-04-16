import TopBar from "../../../components/TopBar";

/** @param {"self"|"other"} variant */
export default function ProfilePageSkeleton({ variant = "self" }) {
  if (variant === "other") {
    return (
      <div className="page fadein">
        <TopBar title="" />
        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <div className="skel skel-circle" style={{ width: 56, height: 56, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ width: 120, height: 18, marginBottom: 6 }} />
                <div className="skel" style={{ width: 70, height: 20, borderRadius: 5 }} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="skel" style={{ width: 65, height: 13, marginBottom: 4 }} />
                <div className="skel" style={{ width: 30, height: 15, marginLeft: "auto" }} />
              </div>
            </div>
            <div className="rep-card" style={{ padding: 16 }}>
              <div className="skel-rep" style={{ width: 80, height: 10, marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="skel-rep" style={{ width: 70, height: 28 }} />
                <div className="skel-rep" style={{ width: 60, height: 22, borderRadius: 5 }} />
              </div>
              <div className="skel-rep" style={{ width: "100%", height: 2, marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {[40, 50, 46, 44].map((w, i) => (
                  <div key={i} className="skel-rep" style={{ width: w, height: 9 }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skel" style={{ width: "100%", height: 50 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
        <div className="tlogo">
          <div className="skel" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <div className="skel" style={{ width: 90, height: 16 }} />
        </div>
        <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
      </div>
      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <div className="skel skel-circle" style={{ width: 56, height: 56, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skel" style={{ width: 120, height: 18, marginBottom: 6 }} />
              <div className="skel" style={{ width: 160, height: 11, marginBottom: 8 }} />
              <div className="skel" style={{ width: 70, height: 20, borderRadius: 5 }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="skel" style={{ width: 65, height: 13, marginBottom: 4 }} />
              <div className="skel" style={{ width: 30, height: 15, marginLeft: "auto" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skel" style={{ height: 60, borderRadius: "var(--r)" }} />
            ))}
          </div>
          <div className="rep-card" style={{ padding: 16 }}>
            <div className="skel-rep" style={{ width: 140, height: 10, marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="skel-rep" style={{ width: 70, height: 28 }} />
              <div className="skel-rep" style={{ width: 60, height: 22, borderRadius: 5 }} />
            </div>
            <div className="skel-rep" style={{ width: "100%", height: 2, marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[40, 50, 46, 44].map((w, i) => (
                <div key={i} className="skel-rep" style={{ width: w, height: 9 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
