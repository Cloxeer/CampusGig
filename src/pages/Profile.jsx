import { useState } from "react";
import { Shield, Award, Trophy, Pencil } from "lucide-react";
import { MY_REP, ACTIVITY, LEADERBOARD } from "../data/mockData";
import { getLevel } from "../utils/helpers";
import Logo from "../components/Logo";
import LevelBadge from "../components/LevelBadge";
import Stars from "../components/Stars";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";
import RepDetailModal from "../components/modals/RepDetailModal";

export default function Profile({ setScreen }) {
  const [pTab, setPTab] = useState("activity");
  const [showReviews, setShowReviews] = useState(false);
  const [showRepDetail, setShowRepDetail] = useState(false);
  const [editField, setEditField] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    venmo: "@mayavenmo",
    cashapp: "$maya-torres",
    paypal: "maya@aggiemail.edu",
    phone: "+1 (530) 555-0192",
    preferred: "Venmo + text",
  });
  const lvl = getLevel(MY_REP);

  const CONTACT_FIELDS = [
    { key: "venmo", label: "Venmo", prefix: "@" },
    { key: "cashapp", label: "Cash App", prefix: "$" },
    { key: "paypal", label: "PayPal", prefix: "" },
    { key: "phone", label: "Phone", prefix: "" },
    { key: "preferred", label: "Best way to reach", prefix: "" },
  ];

  return (
    <>
      <div className="page fadein">
        {/* Top bar */}
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={() => setScreen("home")}>
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <Logo />
          <button className="btn bg-btn bsm">Edit</button>
        </div>

        <div className="scroll" style={{ paddingBottom: 80 }}>
          {/* Identity row */}
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#6366f1",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--bd)",
                  flexShrink: 0,
                }}
              >
                MT
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 2 }}>Maya Torres</div>
                <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
                  maya.torres@aggiemail.ucdavis.edu
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <LevelBadge label={lvl.label} />
                  <span className="badge bn">
                    <Shield size={9} /> .edu
                  </span>
                </div>
              </div>
              {/* Rating */}
              <div
                style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                onClick={() => setShowReviews(true)}
              >
                <Stars n={5} size={13} filled />
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "-.03em", marginTop: 2 }}>
                  4.9
                </div>
                <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>28 reviews</div>
                <div style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>tap to view</div>
              </div>
            </div>

            {/* Stat boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
              <div className="stat-box" onClick={() => setPTab("activity")}>
                <div className="sval">28</div>
                <div className="skey">gigs done</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setShowRepDetail(true)}>
                <div className="sval">{MY_REP}</div>
                <div className="skey">rep score</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setPTab("leaderboard")}>
                <div className="sval">#3</div>
                <div className="skey">campus rank</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
            </div>

            {/* Rep card */}
            <div className="rep-card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => setShowRepDetail(true)}>
              <div className="rc-ey">Rep Score · tap for details</div>
              <div className="rc-row">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span className="rc-score">{MY_REP}</span>
                  <span className="rc-pts">pts</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="rc-badge" style={{ marginBottom: 4 }}>
                    <Award size={10} /> {lvl.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--mono)" }}>#3 of 847 students</div>
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

          {/* Sub-tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--bd)" }}>
            {[
              ["activity", "Activity"],
              ["leaderboard", "Board"],
              ["contact", "Contact"],
            ].map(([k, l]) => (
              <button key={k} className={`ptab ${pTab === k ? "on" : ""}`} onClick={() => setPTab(k)}>
                {l}
              </button>
            ))}
          </div>

          {/* Activity tab */}
          {pTab === "activity" && (
            <div style={{ padding: "0 16px" }}>
              {ACTIVITY.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 0",
                    borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--bd)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "var(--r)",
                      background: "var(--bg3)",
                      border: "1px solid var(--bd)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "var(--fg3)",
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{a.t}</div>
                    <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginTop: 1 }}>{a.s}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "var(--mono)",
                      color: a.pos ? "var(--green-d)" : "var(--fg3)",
                      flexShrink: 0,
                    }}
                  >
                    {a.d}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard tab */}
          {pTab === "leaderboard" && (
            <div>
              <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", gap: 4 }}>
                <Trophy size={12} color="var(--fg3)" />
                <span style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Campus · this week</span>
              </div>
              {LEADERBOARD.map((p) => (
                <div key={p.rank} className={`lb-row ${p.isYou ? "lb-you" : ""}`}>
                  <span className={`lb-rank ${p.rank <= 3 ? "top" : ""}`}>{p.rank}</span>
                  <div className="lb-av" style={{ background: p.color }}>
                    {p.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                      {p.name}
                      {p.isYou && (
                        <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginLeft: 5 }}>you</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--fg3)",
                        fontFamily: "var(--mono)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {p.gigs} gigs · <LevelBadge label={getLevel(p.rep).label} small />
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg2)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                    {p.rep}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Contact tab */}
          {pTab === "contact" && (
            <div style={{ padding: "10px 16px 0" }}>
              <div style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 10, lineHeight: 1.5 }}>
                Tap any field to edit. Contact info is <strong style={{ color: "var(--fg)" }}>private</strong> until both parties accept
                a gig.
              </div>
              {CONTACT_FIELDS.map((f) => (
                <div key={f.key} className="editable-field" onClick={() => setEditField(f.key)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ef-label">{f.label}</div>
                    {editField === f.key ? (
                      <input
                        autoFocus
                        className="inp"
                        style={{ height: 32, marginTop: 2, padding: "0 8px", fontSize: 13 }}
                        value={contactInfo[f.key]}
                        onChange={(e) => setContactInfo({ ...contactInfo, [f.key]: e.target.value })}
                        onBlur={() => setEditField(null)}
                      />
                    ) : (
                      <div className={contactInfo[f.key] ? "ef-val" : "ef-empty"}>
                        {contactInfo[f.key] || "Tap to add"}
                      </div>
                    )}
                  </div>
                  <Pencil size={13} color="var(--fg4)" />
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 16 }} />
        </div>
      </div>

      {/* Modals — rendered outside .page to avoid fadein transform stacking context trapping them behind BottomNav */}
      {showReviews && <ReviewSheetModal onClose={() => setShowReviews(false)} />}
      {showRepDetail && <RepDetailModal onClose={() => setShowRepDetail(false)} />}
    </>
  );
}
