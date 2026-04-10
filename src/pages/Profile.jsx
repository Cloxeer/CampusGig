import { useState, useEffect } from "react";
import { Award, Trophy, LogOut, Pencil, CheckCircle, Star, Package, Loader } from "lucide-react";
import { getMyProfile, getMyReviews, getMyGigStats, getCampusRank, getTotalUsers, getLeaderboard, getMyActivity, getAvatarUrl } from "../lib/profile";
import { logout } from "../lib/auth";
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
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [gigStats, setGigStats] = useState({ completed: 0, posted: 0 });
  const [rank, setRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState({ completedGigs: [], receivedReviews: [], postedGigs: [] });
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    setLoading(true);
    const { profile: p } = await getMyProfile();
    setProfile(p);

    if (p) {
      if (p.avatar_url) {
        const url = getAvatarUrl(p.avatar_url);
        if (url) setAvatarUrl(url);
      }

      const [reviewsRes, statsRes, rankRes, totalRes, boardRes, actRes] = await Promise.all([
        getMyReviews(),
        getMyGigStats(),
        getCampusRank(p.rep_score || 0),
        getTotalUsers(),
        getLeaderboard(10),
        getMyActivity(),
      ]);
      setReviews(reviewsRes.reviews);
      setGigStats(statsRes);
      setRank(rankRes.rank);
      setTotalUsers(totalRes.total);
      setLeaderboard(boardRes.leaderboard);
      setActivity(actRes);
    }
    setLoading(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  if (loading) {
    return (
      <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader size={20} className="spin" color="var(--fg3)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Profile not found</div>
      </div>
    );
  }

  const repScore = profile.rep_score || 0;
  const lvl = getLevel(repScore);
  const initials = `${profile.first_name?.charAt(0) || ""}${profile.last_name?.charAt(0) || ""}`.toUpperCase();
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  const activityItems = [
    ...activity.completedGigs.map((g) => ({
      icon: <CheckCircle size={15} />,
      t: `${g.category?.label || "Gig"} completed`,
      s: `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""} · $${Number(g.price).toFixed(2)}`,
      d: "+10 pts",
      pos: true,
      time: new Date(g.updated_at).getTime(),
    })),
    ...activity.receivedReviews.map((r) => ({
      icon: <Star size={15} />,
      t: `${r.rating}-star review received`,
      s: `From ${r.reviewer?.first_name || "User"} — "${r.text?.slice(0, 30)}${r.text?.length > 30 ? "…" : ""}"`,
      d: r.rating === 5 ? "+5 pts" : r.rating === 4 ? "+2 pts" : "",
      pos: r.rating >= 4,
      time: new Date(r.created_at).getTime(),
    })),
    ...activity.postedGigs.map((g) => ({
      icon: <Package size={15} />,
      t: `${g.category?.label || "Gig"} posted`,
      s: `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""} · ${g.status}`,
      d: g.status === "open" ? "open" : g.status,
      pos: false,
      time: new Date(g.created_at).getTime(),
    })),
  ].sort((a, b) => b.time - a.time);

  return (
    <>
      <div className="page fadein">
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={() => setScreen("home")}>
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <Logo />
          <button
            className="btn bsm"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              opacity: loggingOut ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
            }}
          >
            {loggingOut ? <Loader size={12} className="spin" /> : <LogOut size={12} />}
            {loggingOut ? "…" : "Log out"}
          </button>
        </div>

        <div className="scroll" style={{ paddingBottom: 80 }}>
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--bd)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: profile.avatar_color || "#6366f1",
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
                  {initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 2 }}>{fullName}</div>
                <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
                  {profile.email}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <LevelBadge label={lvl.label} />
                  <span
                    className="badge bn"
                    style={{ cursor: "pointer" }}
                    onClick={() => setScreen("editProfile")}
                  >
                    <Pencil size={9} /> Edit
                  </span>
                </div>
              </div>
              <div
                style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                onClick={() => setShowReviews(true)}
              >
                <Stars n={5} size={13} filled={reviews.length > 0} />
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "-.03em", marginTop: 2 }}>
                  {avgRating}
                </div>
                <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>tap to view</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
              <div className="stat-box" onClick={() => setPTab("activity")}>
                <div className="sval">{gigStats.completed}</div>
                <div className="skey">gigs done</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setShowRepDetail(true)}>
                <div className="sval">{repScore}</div>
                <div className="skey">rep score</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setPTab("leaderboard")}>
                <div className="sval">#{rank || "—"}</div>
                <div className="skey">campus rank</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
            </div>

            <div className="rep-card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => setShowRepDetail(true)}>
              <div className="rc-ey">Rep Score · tap for details</div>
              <div className="rc-row">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span className="rc-score">{repScore}</span>
                  <span className="rc-pts">pts</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="rc-badge" style={{ marginBottom: 4 }}>
                    <Award size={10} /> {lvl.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--mono)" }}>
                    #{rank || "—"} of {totalUsers} student{totalUsers !== 1 ? "s" : ""}
                  </div>
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

          {pTab === "activity" && (
            <div style={{ padding: "0 16px" }}>
              {activityItems.length === 0 && (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                  No activity yet — complete or post a gig to get started.
                </div>
              )}
              {activityItems.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 0",
                    borderBottom: i < activityItems.length - 1 ? "1px solid var(--bd)" : "none",
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

          {pTab === "leaderboard" && (
            <div>
              <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", gap: 4 }}>
                <Trophy size={12} color="var(--fg3)" />
                <span style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Campus · all time</span>
              </div>
              {leaderboard.length === 0 && (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                  No leaderboard data yet.
                </div>
              )}
              {leaderboard.map((p) => (
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
                      <LevelBadge label={getLevel(p.rep).label} small />
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg2)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                    {p.rep}
                  </span>
                </div>
              ))}
            </div>
          )}

          {pTab === "contact" && (
            <div style={{ padding: "10px 16px 0" }}>
              <div style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 10, lineHeight: 1.5 }}>
                Contact info is <strong style={{ color: "var(--fg)" }}>private</strong> until both parties accept a gig.
                <span
                  style={{ color: "var(--accent)", cursor: "pointer", marginLeft: 6 }}
                  onClick={() => setScreen("editProfile")}
                >
                  Edit →
                </span>
              </div>
              {[
                { label: "Phone", value: profile.phone },
                { label: "Venmo", value: profile.venmo },
                { label: "Cash App", value: profile.cashapp },
                { label: "PayPal", value: profile.paypal },
                { label: "Snapchat", value: profile.snapchat },
              ].map((f) => (
                <div key={f.label} className="editable-field" onClick={() => setScreen("editProfile")}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ef-label">{f.label}</div>
                    <div className={f.value ? "ef-val" : "ef-empty"}>
                      {f.value || "Not set"}
                    </div>
                  </div>
                  <Pencil size={13} color="var(--fg4)" />
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 16 }} />
        </div>
      </div>

      {showReviews && (
        <ReviewSheetModal
          onClose={() => setShowReviews(false)}
          reviews={reviews}
          avgRating={parseFloat(avgRating)}
          reviewCount={reviews.length}
          isOwnProfile
        />
      )}
      {showRepDetail && (
        <RepDetailModal
          onClose={() => setShowRepDetail(false)}
          repScore={repScore}
        />
      )}
    </>
  );
}
