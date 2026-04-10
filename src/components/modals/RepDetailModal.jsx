import { X, Award, Check } from "lucide-react";
import { MY_REP, REP_LEVELS } from "../../data/mockData";
import { getLevel } from "../../utils/helpers";
import LevelBadge from "../LevelBadge";

export default function RepDetailModal({ onClose }) {
  const lvl = getLevel(MY_REP);

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
          {/* Score card */}
          <div className="rep-card" style={{ marginBottom: 20 }}>
            <div className="rc-ey">Current score</div>
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
          </div>

          {/* Level breakdown */}
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Level breakdown</div>
          {REP_LEVELS.map((l, i) => (
            <div
              key={l.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < REP_LEVELS.length - 1 ? "1px solid var(--bd)" : "none",
              }}
            >
              <LevelBadge label={l.label} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                  {l.max === Infinity ? `${l.min}+ pts` : `${l.min}–${l.max} pts`}
                </div>
              </div>
              {MY_REP >= l.min && <Check size={14} color="var(--green-d)" />}
            </div>
          ))}

          {/* How to earn */}
          <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 10px" }}>How to earn Rep</div>
          {[
            { t: "Complete a gig", d: "+10 pts" },
            { t: "Receive a 5-star rating", d: "+5 pts" },
            { t: "Receive a 4-star rating", d: "+2 pts" },
            { t: "Post a gig (encourages activity)", d: "+1 pt" },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < 3 ? "1px solid var(--bd)" : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--fg)" }}>{r.t}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green-d)", fontFamily: "var(--mono)" }}>{r.d}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
