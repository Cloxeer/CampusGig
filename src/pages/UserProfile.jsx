import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, Package, Timer, Star, Settings } from "lucide-react";
import {
  getGigById, parseDeadline, getUserProfilePageData,
} from "../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../lib/queryClient";
import { getLevel, useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import TopBar from "../components/TopBar";
import LevelBadge from "../components/LevelBadge";
import Stars from "../components/Stars";
import UserAvatar from "../components/UserAvatar";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";
import DeleteReviewConfirmModal from "../components/modals/DeleteReviewConfirmModal";
import GigDetailModal from "../components/modals/GigDetailModal";

const USER_PROFILE_STALE_MS = 5 * 60 * 1000;

export default function UserProfile({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const selfRedirect = Boolean(currentUserId && userId && String(userId) === String(currentUserId));
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [reviewForm, setReviewForm] = useState(null);
  /** Which review row has the settings dropdown open (same interaction model as report flag in ReviewSheetModal). */
  const [settingsMenuReviewId, setSettingsMenuReviewId] = useState(null);
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState(null);
  const settingsMenuRef = useRef(null);
  const [upTab, setUpTab] = useState("reviews");
  const tick = useTimer();

  const { data: pageData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.userProfilePage(userId),
    queryFn: () => getUserProfilePageData(userId),
    enabled: Boolean(userId && !selfRedirect),
    staleTime: USER_PROFILE_STALE_MS,
  });

  const { data: modalGig, isPending: gigModalPending } = useQuery({
    queryKey: queryKeys.gigById(gigParam),
    queryFn: async () => {
      const { gig } = await getGigById(gigParam);
      return gig ?? null;
    },
    enabled: Boolean(gigParam),
    staleTime: GIG_DETAIL_STALE_MS,
  });

  useEffect(() => {
    if (userId === currentUserId) {
      navigate("/profile", { replace: true, state: location.state });
    }
  }, [userId, currentUserId, navigate, location.state]);

  useEffect(() => {
    if (!gigParam) return;
    if (!gigModalPending && modalGig === null) closeGig();
  }, [gigParam, gigModalPending, modalGig, closeGig]);

  useEffect(() => {
    if (!settingsMenuReviewId) return;
    function closeOnOutside(ev) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(ev.target)) {
        setSettingsMenuReviewId(null);
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [settingsMenuReviewId]);

  function refreshUserProfile() {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfilePage(userId) });
  }

  if (selfRedirect) {
    return null;
  }

  const profile = pageData?.profile ?? null;
  const reviews = pageData?.reviews ?? [];
  const avatarUrl = pageData?.avatarUrl ?? null;
  const firstPendingGigId = pageData?.firstPendingGigId ?? null;
  const hasPendingReview = pageData?.hasPendingReview ?? false;
  const myReviewsToThem = pageData?.myReviewsToThem ?? [];
  const userActivity = pageData?.userActivity ?? { postedGigs: [], completedGigs: [] };
  const gigStats = pageData?.gigStats ?? { completed: 0, posted: 0 };
  const rank = pageData?.rank ?? null;
  const totalUsers = pageData?.totalUsers ?? 0;

  /** Full skeleton only when this user has never been loaded (no React Query cache). */
  if (profilePending) {
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

        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
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
                {(hasPendingReview || myReviewsToThem.length > 0) && (
                  <div style={{ fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                    {hasPendingReview ? "Tap to review" : "Tap for reviews"}
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
                  const isMine = currentUserId && String(r.reviewer_id || "") === String(currentUserId);
                  return (
                    <div
                      key={r.id || idx}
                      className="rev-row"
                      style={{
                        marginLeft: -16,
                        marginRight: -16,
                        width: "calc(100% + 32px)",
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderBottom: idx < reviews.length - 1 ? undefined : "none",
                      }}
                    >
                      <UserAvatar user={reviewer} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{reviewer.first_name || "User"}</span>
                          <Stars rating={r.rating} size={11} />
                        </div>
                        {r.text ? (
                          <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>{r.text}</div>
                        ) : null}
                      </div>
                      {isMine && (
                        <div
                          ref={settingsMenuReviewId === r.id ? settingsMenuRef : null}
                          style={{ position: "relative", flexShrink: 0, alignSelf: "center" }}
                        >
                          <button
                            type="button"
                            className="rev-flag"
                            aria-label="Edit or delete your review"
                            aria-expanded={settingsMenuReviewId === r.id}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSettingsMenuReviewId((id) => (id === r.id ? null : r.id));
                            }}
                          >
                            <Settings size={13} strokeWidth={2} />
                          </button>
                          {settingsMenuReviewId === r.id && (
                            <div
                              role="menu"
                              className="profile-menu-dropdown"
                              style={{
                                position: "absolute",
                                top: "calc(100% + 6px)",
                                right: 0,
                                zIndex: 50,
                                minWidth: 200,
                                padding: 6,
                                borderRadius: "var(--r)",
                                border: "1px solid var(--bd)",
                                background: "var(--bg)",
                                boxShadow:
                                  "0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="btn"
                                onClick={() => {
                                  setReviewForm({ type: "edit", reviewId: r.id });
                                  openReviews();
                                  setSettingsMenuReviewId(null);
                                }}
                                style={{
                                  width: "100%",
                                  justifyContent: "flex-start",
                                  gap: 8,
                                  padding: "8px 10px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  border: "none",
                                  background: "transparent",
                                }}
                              >
                                Change review
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="btn"
                                onClick={() => {
                                  setSettingsMenuReviewId(null);
                                  setDeleteConfirmReviewId(r.id);
                                }}
                                style={{
                                  width: "100%",
                                  justifyContent: "flex-start",
                                  gap: 8,
                                  padding: "8px 10px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  border: "none",
                                  background: "transparent",
                                  color: "#dc2626",
                                }}
                              >
                                Delete review
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {hasPendingReview ? (
                <button
                  className="btn bp bfull"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setReviewForm({ type: "new" });
                    openReviews();
                  }}
                >
                  <Star size={14} />
                  Leave a review
                </button>
              ) : myReviewsToThem.length === 0 ? (
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
              ) : null}
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
          onClose={() => {
            closeReviews();
            setReviewForm(null);
          }}
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviews.length}
          isOwnProfile={false}
          currentUserId={currentUserId}
          revieweeId={userId}
          pendingGigId={firstPendingGigId}
          hasPendingReview={hasPendingReview}
          myReviewsToThem={myReviewsToThem}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onReviewSubmitted={() => {
            closeReviews();
            setReviewForm(null);
            refreshUserProfile();
          }}
        />
      )}
      {deleteConfirmReviewId && (
        <DeleteReviewConfirmModal
          reviewId={deleteConfirmReviewId}
          gigTitle={myReviewsToThem.find((x) => x.id === deleteConfirmReviewId)?.gig_title}
          onClose={() => setDeleteConfirmReviewId(null)}
          onDeleted={() => refreshUserProfile()}
        />
      )}
      {gigParam && (modalGig != null || gigModalPending) && (
        <GigDetailModal
          gig={modalGig}
          loading={gigModalPending && modalGig == null}
          tick={tick}
          requested={false}
          onRequest={() => {}}
          onClose={closeGig}
          onViewProfile={(uid) => {
            const q = gigParam ? `?gig=${encodeURIComponent(gigParam)}` : "";
            navigate(`/users/${uid}`, { state: { returnTo: `/users/${userId}${q}` } });
          }}
          currentUserId={currentUserId}
          onGigDeleted={() => {
            refreshUserProfile();
            queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
          }}
        />
      )}
    </>
  );
}
