import { useState } from "react";
import { Search, Zap, Award, Navigation } from "lucide-react";
import { ALL_GIGS, MY_REP } from "../data/mockData";
import { getLevel, useTimer } from "../utils/helpers";
import Logo, { LogoMark } from "../components/Logo";
import GigCard from "../components/GigCard";
import GigDetailModal from "../components/modals/GigDetailModal";

const TABS = ["Recent", "Food", "Errands", "Notes", "All"];

export default function Home({ setScreen }) {
  const [tab, setTab] = useState("Recent");
  const [selectedGig, setSelectedGig] = useState(null);
  const [requested, setRequested] = useState(false);
  const tick = useTimer();

  const lvl = getLevel(MY_REP);

  const filteredGigs = ALL_GIGS.filter((g) => {
    if (tab === "Recent" || tab === "All") return true;
    if (tab === "Food") return g.cat === "Food";
    if (tab === "Errands") return g.cat === "Errand";
    if (tab === "Notes") return g.cat === "Notes";
    return true;
  });

  return (
    <div className="page fadein">
      {/* Top bar */}
      <div className="topbar">
        <div className="tlogo">
          <LogoMark />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn bg-btn bico" onClick={() => setScreen("explore")}>
            <Search size={15} />
          </button>
          <div className="av" style={{ background: "#6366f1" }} onClick={() => setScreen("profile")}>
            MT
            <div className="av-dot" />
          </div>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 80 }}>
        {/* Rep card */}
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ cursor: "pointer" }} onClick={() => setScreen("repDetail")}>
            <div className="rc-ey">Rep Score · tap for details</div>
            <div className="rc-row">
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span className="rc-score">{MY_REP}</span>
                <span className="rc-pts">pts</span>
              </div>
              <div className="rc-badge">
                <Award size={10} /> {lvl.label}
              </div>
            </div>
            <div className="rc-track">
              <div className="rc-fill" style={{ width: `${lvl.pct}%` }} />
            </div>
            <div className="rc-labels">
              {["New", "Reliable", "Trusted", "Legend"].map((l) => (
                <span key={l} className={`rc-lbl ${lvl.label === l ? "cur" : ""}`}>
                  {l}
                </span>
              ))}
            </div>
            <div className="rc-footer">
              {lvl.next ? (
                <>
                  +{lvl.toNext} pts to <span className="accent">{lvl.next}</span> · +10 per gig completed · +1 per gig posted
                </>
              ) : (
                "Max level reached"
              )}
            </div>
          </div>
        </div>

        {/* Gig list starts below */}

        {/* Tabs */}
        <div style={{ padding: "0 16px" }}>
          <div className="tabs" style={{ margin: "14px -16px 0", padding: "0 16px" }}>
            {TABS.map((t) => (
              <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-.01em" }}>
            {filteredGigs.length} open gig{filteredGigs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Gig list */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
          {filteredGigs.map((g) => (
            <GigCard
              key={g.id}
              gig={g}
              tick={tick}
              onClick={() => {
                setSelectedGig(g);
                setRequested(false);
              }}
            />
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>



      {/* Modals */}
      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          tick={tick}
          requested={requested}
          onRequest={() => setRequested(true)}
          onClose={() => setSelectedGig(null)}
        />
      )}

    </div>
  );
}
