import { useState, useEffect } from "react";
import { X, Award, Check } from "lucide-react";
import { REP_LEVELS } from "../../data/repLevels";
import { getLevel } from "../../utils/helpers";
import { getMyProfile } from "../../lib/profile";
import LevelBadge from "../LevelBadge";

// Omit repScore when opened from App (Home); parent passes it from Profile for instant display.
export default function RepDetailModal({ onClose, repScore: repScoreProp }) {
  const [repScore, setRepScore] = useState(() => (typeof repScoreProp === "number" ? repScoreProp : null));

  useEffect(() => {
    if (typeof repScoreProp === "number") {
      setRepScore(repScoreProp);
      return;
    }
    let cancelled = false;
    (async () => {
      const { profile } = await getMyProfile();
      if (!cancelled) setRepScore(profile?.rep_score ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [repScoreProp]);

  const score = repScore ?? 0;
  const lvl = getLevel(score);
  const loading = repScore === null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet slidein" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />

        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--bd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em" }}>Rep Score</div>
          <button className="btn bg-btn bico" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div
              style={{
                padding: "36px 12px",
                textAlign: "center",
                color: "var(--fg3)",
                fontSize: 13,
                fontFamily: "var(--mono)",
                marginBottom: 20,
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              <div className="rep-card" style={{ marginBottom: 20 }}>
                <div className="rc-ey">Current score</div>
                <div className="rc-row">
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span className="rc-score">{score}</span>
                    <span className="rc-pts">pts</span>
                  </div>
                  <div className="rc-badge" style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
                    <Award size={10} /> {lvl.label}
                  </div>
                </div>
                <div className="rc-track">
                  <div className="rc-fill" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
                </div>
                <div className="rc-labels">
                  {["New", "Reliable", "Trusted", "Legend"].map((l) => (
                    <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Level breakdown</div>
              {REP_LEVELS.map((l, i) => {
                const isCurrent = score >= l.min && score <= l.max;
                return (
                  <div
                    key={l.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: i < REP_LEVELS.length - 1 ? "1px solid var(--bd)" : "none",
                      background: isCurrent ? `${l.bg}` : "transparent",
                      borderRadius: isCurrent ? "var(--r)" : 0,
                      margin: isCurrent ? "0 -4px" : 0,
                      paddingLeft: isCurrent ? 4 : 0,
                      paddingRight: isCurrent ? 4 : 0,
                    }}
                  >
                    <LevelBadge label={l.label} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: isCurrent ? l.color : "var(--fg3)", fontWeight: isCurrent ? 600 : 400, fontFamily: "var(--mono)" }}>
                        {l.max === Infinity ? `${l.min}+ pts` : `${l.min}–${l.max} pts`}
                      </div>
                    </div>
                    {score >= l.min && <Check size={14} color={l.color} />}
                  </div>
                );
              })}

              <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 10px" }}>How to earn Rep</div>
              {[
                { t: "Complete a gig you took (taker)", d: "+10 pts", positive: true },
                { t: "Mark your gig done (poster)", d: "+8 pts", positive: true },
                { t: "Receive a 5-star rating", d: "+5 pts", positive: true },
                { t: "Post a gig (encourages activity)", d: "+2 pts", positive: true },
                { t: "Receive a 1-star rating", d: "+1 pt", positive: true },
                { t: "Receive a 0-star rating", d: "-10 pts", positive: false },
              ].map((r, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--bd)" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--fg)" }}>{r.t}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: r.positive ? "var(--green-d)" : "#dc2626", fontFamily: "var(--mono)" }}>{r.d}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
