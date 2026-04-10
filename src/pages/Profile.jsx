import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Trophy, LogOut, Pencil, CheckCircle, Star, Package, Loader, Timer } from "lucide-react";

import { getMyProfile, getMyReviews, getMyGigStats, getCampusRank, getTotalUsers, getLeaderboard, getMyActivity, getAvatarUrl, getGigById, parseDeadline } from "../lib/profile";
import { logout } from "../lib/auth";
import { getLevel, useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import Logo, { LogoMark } from "../components/Logo";
import LevelBadge from "../components/LevelBadge";
import Stars from "../components/Stars";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";
import RepDetailModal from "../components/modals/RepDetailModal";
import GigDetailModal from "../components/modals/GigDetailModal";

export default function Profile({ currentUserId }) {
  const navigate = useNavigate();
  const [repOpen, openRep, closeRep] = useModalParam("rep");
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [pTab, setPTab] = useState("activity");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [gigLoading, setGigLoading] = useState(false);
  const tick = useTimer();

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

  useEffect(() => {
    if (!gigParam) {
      setSelectedGig(null);
      return;
    }
    if (!gigLoading && !selectedGig) {
      fetchGig(gigParam);
    }
  }, [gigParam]);

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
        getLeaderboard(100),
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

  async function fetchGig(gigId) {
    if (!gigId || gigLoading) return;
    setGigLoading(true);
    const { gig } = await getGigById(gigId);
    if (gig) setSelectedGig(gig);
    else closeGig();
    setGigLoading(false);
  }

  if (loading) {
    return (
      <div className="page fadein">
        <div className="topbar">
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
          <div className="tlogo">
            <div className="skel" style={{ width: 26, height: 26, borderRadius: 6 }} />
            <div className="skel" style={{ width: 90, height: 16 }} />
          </div>
          <div className="skel" style={{ width: 72, height: 30, borderRadius: 6 }} />
        </div>
        <div className="scroll" style={{ paddingBottom: 80 }}>
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
      gigId: g.id,
    })),
    ...activity.receivedReviews.map((r) => ({
      icon: <Star size={15} />,
      t: `${r.rating}-star review received`,
      s: `From ${r.reviewer?.first_name || "User"} — "${r.text?.slice(0, 30)}${r.text?.length > 30 ? "…" : ""}"`,
      d: r.rating === 5 ? "+5 pts" : r.rating === 4 ? "+2 pts" : "",
      pos: r.rating >= 4,
      time: new Date(r.created_at).getTime(),
      gigId: null,
    })),
    ...activity.postedGigs.map((g) => {
      const dl = parseDeadline(g);
      const timeEnded = dl && dl < Date.now();
      let statusLabel = g.status === "open" ? "open" : g.status;
      if (timeEnded && g.status === "open") statusLabel = "Time ended";
      const takerName = g.taker ? `${g.taker.first_name || ""} ${g.taker.last_name || ""}`.trim() : null;
      let subtitle = `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""}`;
      if (takerName && (g.status === "active" || g.status === "completed")) {
        subtitle += ` · ${g.status === "active" ? "Taken by" : "Done by"} ${takerName}`;
      } else {
        subtitle += ` · ${statusLabel}`;
      }
      return {
        icon: timeEnded ? <Timer size={15} /> : <Package size={15} />,
        t: `${g.category?.label || "Gig"} posted`,
        s: subtitle,
        d: statusLabel,
        pos: false,
        expired: timeEnded,
        time: new Date(g.created_at).getTime(),
        gigId: g.id,
      };
    }),
  ].sort((a, b) => b.time - a.time);

  return (
    <>
      <div className="page fadein">
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={() => navigate("/")}>
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <div className="tlogo">
            <LogoMark />
            <Logo />
          </div>
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
                    onClick={() => navigate("/profile/edit")}
                  >
                    <Pencil size={9} /> Edit
                  </span>
                </div>
              </div>
              <div
                style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                onClick={() => openReviews()}
              >
                <Stars rating={parseFloat(avgRating)} size={13} />
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "-.03em", marginTop: 2 }}>
                  {avgRating}
                </div>
                <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                  {reviews.length > 0
                    ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`
                    : "No reviews"}
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
              <div className="stat-box" onClick={() => setPTab("activity")}>
                <div className="sval">{gigStats.posted}</div>
                <div className="skey">gigs posted</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setPTab("leaderboard")}>
                <div className="sval">#{rank || "—"}</div>
                <div className="skey">campus rank</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
            </div>

            <div className="rep-card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => openRep()}>
              <div className="rc-ey">Rep Score · tap for details</div>
              <div className="rc-row">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span className="rc-score">{repScore}</span>
                  <span className="rc-pts">pts</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="rc-badge" style={{ marginBottom: 4, background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
                    <Award size={10} /> {lvl.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--mono)" }}>
                    #{rank || "—"} of {totalUsers} student{totalUsers !== 1 ? "s" : ""}
                  </div>
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
              <div className="rc-footer">
                {lvl.next ? (
                  <>
                    +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +9 marking done · +10 as taker · +1 per post
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
                    cursor: a.gigId ? "pointer" : "default",
                  }}
                  onClick={() => a.gigId && openGig(a.gigId)}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "var(--r)",
                      background: a.expired ? "var(--err-bg)" : "var(--bg3)",
                      border: `1px solid ${a.expired ? "#fecaca" : "var(--bd)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: a.expired ? "var(--err)" : "var(--fg3)",
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
                      color: a.expired ? "var(--err)" : a.pos ? "var(--green-d)" : "var(--fg3)",
                      flexShrink: 0,
                    }}
                  >
                    {a.d}
                  </span>
                </div>
              ))}
            </div>
          )}

          {pTab === "leaderboard" && (() => {
            const userInBoard = leaderboard.some((p) => p.isYou);
            return (
              <div>
                <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Trophy size={12} color="var(--fg3)" />
                    <span style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Campus · top 100</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                    {totalUsers} student{totalUsers !== 1 ? "s" : ""}
                  </span>
                </div>
                {leaderboard.length === 0 && (
                  <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                    No leaderboard data yet.
                  </div>
                )}
                {leaderboard.map((p) => (
                  <div
                    key={p.rank}
                    className={`lb-row ${p.isYou ? "lb-you" : ""}`}
                    style={{ cursor: p.isYou ? "default" : "pointer" }}
                    onClick={() => {
                      if (!p.isYou && p.userId) navigate(`/users/${p.userId}`);
                    }}
                  >
                    <span className={`lb-rank ${p.rank <= 3 ? "top" : ""}`}>{p.rank}</span>
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div className="lb-av" style={{ background: p.color }}>
                        {p.initials}
                      </div>
                    )}
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

                {!userInBoard && rank && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "6px 16px",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 18, color: "var(--fg4)", letterSpacing: 2 }}>···</span>
                    </div>
                    <div
                      className="lb-row lb-you"
                      style={{
                        position: "sticky",
                        bottom: 0,
                        borderTop: "2px solid var(--green-bd)",
                        borderBottom: "none",
                        background: "var(--green-bg)",
                      }}
                    >
                      <span className="lb-rank">{rank}</span>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div className="lb-av" style={{ background: profile.avatar_color || "#6366f1" }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                          {fullName}
                          <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginLeft: 5 }}>you</span>
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
                          <LevelBadge label={lvl.label} small />
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg2)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                        {repScore}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          <div style={{ height: 16 }} />
        </div>
      </div>

      {reviewsOpen && (
        <ReviewSheetModal
          onClose={closeReviews}
          reviews={reviews}
          avgRating={parseFloat(avgRating)}
          reviewCount={reviews.length}
          isOwnProfile
        />
      )}
      {repOpen && (
        <RepDetailModal
          onClose={closeRep}
          repScore={repScore}
        />
      )}
      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          tick={tick}
          requested={false}
          onRequest={() => {}}
          onClose={closeGig}
          onViewProfile={(userId) => navigate(`/users/${userId}`)}
          currentUserId={currentUserId}
          onGigDeleted={() => loadProfileData()}
        />
      )}
      {gigLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            maxWidth: 393,
            margin: "0 auto",
            background: "rgba(255,255,255,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader size={20} className="spin" color="var(--fg3)" />
        </div>
      )}
    </>
  );
}
