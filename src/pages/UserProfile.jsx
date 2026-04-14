import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Loader, CheckCircle, Package, Timer, Star } from "lucide-react";
import { getProfileById, getReviewsForUser, getAvatarUrl, getCompletedGigsBetweenUsers, getExistingReview, getUserActivity, getGigById, parseDeadline, getUserGigStats, getCampusRank, getTotalUsers } from "../lib/profile";
import { getLevel, useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import TopBar from "../components/TopBar";
import LevelBadge from "../components/LevelBadge";
import Stars from "../components/Stars";
import UserAvatar from "../components/UserAvatar";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";
import GigDetailModal from "../components/modals/GigDetailModal";

export default function UserProfile({ currentUserId }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewGigId, setReviewGigId] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [upTab, setUpTab] = useState("reviews");
  const [userActivity, setUserActivity] = useState({ postedGigs: [], completedGigs: [] });
  const [gigStats, setGigStats] = useState({ completed: 0, posted: 0 });
  const [rank, setRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedGig, setSelectedGig] = useState(null);
  const [gigLoading, setGigLoading] = useState(false);
  const tick = useTimer();

  useEffect(() => {
    if (userId === currentUserId) {
      navigate("/profile", { replace: true });
      return;
    }
    loadData();
  }, [userId]);

  useEffect(() => {
    if (!gigParam) {
      setSelectedGig(null);
      return;
    }
    if (!gigLoading && !selectedGig) {
      fetchGig(gigParam);
    }
  }, [gigParam]);

  async function loadData() {
    setLoading(true);
    setCanReview(false);
    setAlreadyReviewed(false);
    setReviewGigId(null);
    setExistingReview(null);

    const { profile: p } = await getProfileById(userId);
    setProfile(p);

    if (p) {
      if (p.avatar_url) {
        const url = getAvatarUrl(p.avatar_url);
        if (url) setAvatarUrl(url);
      }

      const [reviewsRes, gigsRes, actRes, statsRes, rankRes, totalRes] = await Promise.all([
        getReviewsForUser(userId),
        getCompletedGigsBetweenUsers(userId),
        getUserActivity(userId),
        getUserGigStats(userId),
        getCampusRank(p.rep_score || 0),
        getTotalUsers(),
      ]);

      setReviews(reviewsRes.reviews);
      setUserActivity(actRes);
      setGigStats(statsRes);
      setRank(rankRes.rank);
      setTotalUsers(totalRes.total);

      const hasCompletedGigs = gigsRes.gigs.length > 0;

      if (hasCompletedGigs) {
        setReviewGigId(gigsRes.gigs[0].id);
      }

      const firstGigId = gigsRes.gigs[0]?.id ?? null;
      const existingRes = firstGigId ? await getExistingReview(userId, firstGigId) : { review: null };

      if (existingRes.review) {
        setAlreadyReviewed(true);
        setExistingReview(existingRes.review);
        setCanReview(true);
      } else {
        setCanReview(hasCompletedGigs);
      }
    }
    setLoading(false);
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
        <TopBar title="" />
        <div className="scroll" style={{ paddingBottom: 80 }}>
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

  if (!profile) {
    return (
      <div className="page fadein">
        <TopBar title="Profile" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 300 }}>
          <div style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)" }}>User not found</div>
        </div>
      </div>
    );
  }

  const repScore = profile.rep_score || 0;
  const lvl = getLevel(repScore);
  const initials = `${profile.first_name?.charAt(0) || ""}${profile.last_name?.charAt(0) || ""}`.toUpperCase();
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <>
      <div className="page fadein">
        <TopBar title={fullName} />

        <div className="scroll" style={{ paddingBottom: 80 }}>
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <UserAvatar
                user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile.avatar_color, first_name: profile.first_name, last_name: profile.last_name }}
                size="xl"
                style={{ border: "2px solid var(--bd)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 2 }}>{fullName}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                  <LevelBadge label={lvl.label} />
                </div>
              </div>
              <div
                style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                onClick={() => openReviews()}
              >
                <Stars rating={avgRating} size={13} />
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "-.03em", marginTop: 2 }}>
                  {avgRating.toFixed(1)}
                </div>
                <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                  {reviews.length > 0
                    ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`
                    : "No reviews"}
                </div>
                {(canReview || alreadyReviewed) && (
                  <div style={{ fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                    {alreadyReviewed ? "Tap to update" : "Tap to review"}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
              <div className="stat-box" onClick={() => setUpTab("activity")}>
                <div className="sval">{gigStats.completed}</div>
                <div className="skey">gigs done</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box" onClick={() => setUpTab("activity")}>
                <div className="sval">{gigStats.posted}</div>
                <div className="skey">gigs posted</div>
                <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
              </div>
              <div className="stat-box">
                <div className="sval">#{rank || "—"}</div>
                <div className="skey">campus rank</div>
                <div style={{ fontSize: 9, color: "var(--fg4)", fontFamily: "var(--mono)", marginTop: 2 }}>of {totalUsers}</div>
              </div>
            </div>

            <div className="rep-card" style={{ marginBottom: 16 }}>
              <div className="rc-ey">Rep Score</div>
              <div className="rc-row">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span className="rc-score">{repScore}</span>
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
                  <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>{l}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid var(--bd)" }}>
            {[
              ["reviews", "Reviews"],
              ["activity", "Activity"],
            ].map(([k, l]) => (
              <button key={k} className={`ptab ${upTab === k ? "on" : ""}`} onClick={() => setUpTab(k)}>
                {l}
              </button>
            ))}
          </div>

          {upTab === "reviews" && (
            <div style={{ padding: "0 16px" }}>
              <div style={{ padding: "10px 0 6px", fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                {reviews.length} review{reviews.length !== 1 ? "s" : ""} · {avgRating.toFixed(1)} avg
              </div>
              {reviews.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                  No reviews yet.
                </div>
              ) : (
                reviews.map((r, idx) => {
                  const reviewer = r.reviewer || {};
                  const rInitials = `${reviewer.first_name?.charAt(0) || "?"}${reviewer.last_name?.charAt(0) || ""}`.toUpperCase();
                  return (
                    <div
                      key={r.id || idx}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "11px 0",
                        borderBottom: idx < reviews.length - 1 ? "1px solid var(--bd)" : "none",
                      }}
                    >
                      <div
                        className="rev-av"
                        style={{ background: reviewer.avatar_color || "#6366f1", width: 30, height: 30, fontSize: 11 }}
                      >
                        {rInitials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{reviewer.first_name || "User"}</span>
                          <Stars rating={r.rating} size={10} />
                        </div>
                        {r.text && <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.4 }}>{r.text}</div>}
                      </div>
                    </div>
                  );
                })
              )}

              {alreadyReviewed ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 12px",
                    background: "var(--green-bg)",
                    border: "1px solid var(--green-bd)",
                    borderRadius: "var(--r)",
                    fontSize: 12,
                    color: "var(--green-text)",
                    fontFamily: "var(--mono)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>You rated {existingReview?.rating || "—"}★</span>
                  <button
                    className="btn bsm"
                    style={{ background: "transparent", color: "var(--green-text)", border: "1px solid var(--green-bd)" }}
                    onClick={() => openReviews()}
                  >
                    Update
                  </button>
                </div>
              ) : canReview ? (
                <button
                  className="btn bp bfull"
                  style={{ marginTop: 16 }}
                  onClick={() => openReviews()}
                >
                  <Star size={14} />
                  Leave a review
                </button>
              ) : (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 12px",
                    background: "var(--bg3)",
                    border: "1px solid var(--bd)",
                    borderRadius: "var(--r)",
                    fontSize: 12,
                    color: "var(--fg3)",
                    fontFamily: "var(--mono)",
                    textAlign: "center",
                  }}
                >
                  Complete a gig with {fullName} to leave a review.
                </div>
              )}
            </div>
          )}

          {upTab === "activity" && (
            <div style={{ padding: "0 16px" }}>
              {userActivity.postedGigs.length === 0 && userActivity.completedGigs.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                  No activity yet.
                </div>
              ) : (
                [
                  ...userActivity.completedGigs.map((g) => ({
                    icon: <CheckCircle size={15} />,
                    t: `${g.category?.label || "Gig"} completed`,
                    s: `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""} · $${Number(g.price).toFixed(2)}`,
                    d: "completed",
                    pos: true,
                    expired: false,
                    time: new Date(g.updated_at).getTime(),
                    gigId: g.id,
                  })),
                  ...userActivity.postedGigs.map((g) => {
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
                ]
                  .sort((a, b) => b.time - a.time)
                  .map((a, i, arr) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 0",
                        borderBottom: i < arr.length - 1 ? "1px solid var(--bd)" : "none",
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
                  ))
              )}
            </div>
          )}

          <div style={{ height: 32 }} />
        </div>
      </div>

      {reviewsOpen && (
        <ReviewSheetModal
          onClose={closeReviews}
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviews.length}
          isOwnProfile={false}
          revieweeId={userId}
          gigId={reviewGigId}
          canReview={canReview || alreadyReviewed}
          alreadyReviewed={alreadyReviewed}
          existingReview={existingReview}
          onReviewSubmitted={() => {
            closeReviews();
            loadData();
          }}
        />
      )}
      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          tick={tick}
          requested={false}
          onRequest={() => {}}
          onClose={closeGig}
          onViewProfile={(uid) => navigate(`/users/${uid}`)}
          currentUserId={currentUserId}
          onGigDeleted={() => loadData()}
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
