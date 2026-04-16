import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Award, Trophy, LogOut, Pencil, CheckCircle, Star, Package, Loader, Timer, Settings, HelpCircle, Shield, FileText, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getMyProfile, getMyReviews, getMyGigStats, getCampusRank, getTotalUsers, getLeaderboard, getMyActivity, getAvatarUrl, parseDeadline } from "../lib/profile";
import { logout } from "../lib/auth";
import { queryClient, queryKeys } from "../lib/queryClient";
import { getLevel } from "../utils/helpers";
import { useModalParam, safeAppReturnTo } from "../hooks/useModalParam";
import Logo, { LogoMark } from "../components/Logo";
import LevelBadge from "../components/LevelBadge";
import UserAvatar from "../components/UserAvatar";
import Stars from "../components/Stars";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";
import RepDetailModal from "../components/modals/RepDetailModal";
import AlertDetailModal from "../components/modals/AlertDetailModal";

const PROFILE_MENU_EXIT_FALLBACK_MS = 520;
const STATS_STALE_TIME = 5 * 60 * 1000;

export default function Profile({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const profileBackTarget = safeAppReturnTo(location.state);
  const [repOpen, openRep, closeRep] = useModalParam("rep");
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");

  const [pTab, setPTab] = useState("activity");
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuShow, setProfileMenuShow] = useState(false);
  const [profileMenuLeave, setProfileMenuLeave] = useState(false);
  const profileMenuRef = useRef(null);
  const profileMenuExitTimerRef = useRef(null);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [targetReviewerId, setTargetReviewerId] = useState(null);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  const profile = profileData?.profile || null;

  const { data: reviewsData } = useQuery({
    queryKey: queryKeys.myReviews,
    queryFn: getMyReviews,
    enabled: !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: gigStatsData } = useQuery({
    queryKey: queryKeys.myGigStats,
    queryFn: getMyGigStats,
    enabled: !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: rankData } = useQuery({
    queryKey: queryKeys.campusRank,
    queryFn: () => getCampusRank(profile?.rep_score || 0),
    enabled: !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: totalUsersData } = useQuery({
    queryKey: queryKeys.totalUsers,
    queryFn: getTotalUsers,
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: queryKeys.leaderboard(100),
    queryFn: () => getLeaderboard(100),
    enabled: !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: activityData } = useQuery({
    queryKey: queryKeys.myActivity,
    queryFn: getMyActivity,
    enabled: !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const reviews = reviewsData?.reviews || [];
  const gigStats = gigStatsData || { completed: 0, posted: 0 };
  const rank = rankData?.rank || null;
  const totalUsers = totalUsersData?.total || 0;
  const leaderboard = leaderboardData?.leaderboard || [];
  const activity = activityData || { completedGigs: [], receivedReviews: [], postedGigs: [] };
  const avatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;

  /** Only block the whole page until the main profile row exists in cache. Stats/tabs fill in without a full-screen skeleton. */
  const loading = profilePending;

  function refreshProfileData() {
    queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    queryClient.invalidateQueries({ queryKey: queryKeys.myGigStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.myActivity });
    queryClient.invalidateQueries({ queryKey: queryKeys.campusRank });
    queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard(100) });
    queryClient.invalidateQueries({ queryKey: queryKeys.totalUsers });
    queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenReviews = params.get("reviews") === "1";
    const reviewerId = params.get("reviewer");
    setTargetReviewerId(reviewerId || null);
    if (shouldOpenReviews && !reviewsOpen) {
      openReviews();
    }
  }, [location.search, reviewsOpen, openReviews]);

  const finishProfileMenuExit = useCallback(() => {
    if (profileMenuExitTimerRef.current) {
      clearTimeout(profileMenuExitTimerRef.current);
      profileMenuExitTimerRef.current = null;
    }
    setProfileMenuShow(false);
    setProfileMenuLeave(false);
  }, []);

  async function handleLogout() {
    setProfileMenuOpen(false);
    setLoggingOut(true);
    await logout();
  }

  useEffect(() => {
    if (!profileMenuOpen && profileMenuShow && !profileMenuLeave) {
      setProfileMenuLeave(true);
    }
  }, [profileMenuOpen, profileMenuShow, profileMenuLeave]);

  useEffect(() => {
    if (!profileMenuLeave) return;
    profileMenuExitTimerRef.current = setTimeout(finishProfileMenuExit, PROFILE_MENU_EXIT_FALLBACK_MS);
    return () => {
      if (profileMenuExitTimerRef.current) {
        clearTimeout(profileMenuExitTimerRef.current);
        profileMenuExitTimerRef.current = null;
      }
    };
  }, [profileMenuLeave, finishProfileMenuExit]);

  function handleProfileMenuAnimationEnd(e) {
    if (e.target !== e.currentTarget) return;
    if (!profileMenuLeave) return;
    const name = e.animationName || "";
    if (name.includes("EaseIn") || name.includes("InReduced")) return;
    finishProfileMenuExit();
  }

  useEffect(() => {
    if (!profileMenuOpen) return;
    function closeOnOutside(ev) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(ev.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [profileMenuOpen]);

  if (loading) {
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

  if (!profile) {
    return (
      <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Profile not found</div>
      </div>
    );
  }

  const repScore = profile.rep_score || 0;
  const lvl = getLevel(repScore);
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
    ...activity.receivedReviews.map((r) => {
      const rounded = Math.round(r.rating);
      const isZero = rounded === 0;
      return {
        icon: <Star size={15} />,
        t: `${r.rating}-star review received`,
        s: `From ${r.reviewer?.first_name || "User"} — "${r.text?.slice(0, 30)}${r.text?.length > 30 ? "…" : ""}"`,
        d: isZero ? "-10 pts" : `+${rounded} pts`,
        pos: !isZero,
        time: new Date(r.created_at).getTime(),
        gigId: null,
        reviewerId: r.reviewer_id || null,
      };
    }),
    ...activity.postedGigs.map((g) => {
      const dl = parseDeadline(g);
      const isExpired = dl && dl < Date.now();
      const takerName = g.taker ? `${g.taker.first_name || ""} ${g.taker.last_name || ""}`.trim() : null;

      let statusLabel, subtitle;
      const titleSnip = `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""}`;

      if (g.status === "completed" && takerName) {
        statusLabel = "Done";
        subtitle = `${titleSnip} · Done by ${takerName}`;
      } else if (g.status === "active" && takerName) {
        statusLabel = isExpired ? "Time ended" : "Active";
        subtitle = `${titleSnip} · Taken by ${takerName}`;
      } else if (g.status === "active" && isExpired) {
        statusLabel = "Time ended";
        subtitle = `${titleSnip} · Time ended`;
      } else if (g.status === "open" && isExpired) {
        statusLabel = "Expired";
        subtitle = `${titleSnip} · Expired — no takers`;
      } else {
        statusLabel = g.status === "open" ? "Open" : g.status;
        subtitle = `${titleSnip} · ${statusLabel}`;
      }

      return {
        icon: isExpired && g.status !== "completed" ? <Timer size={15} /> : <Package size={15} />,
        t: `${g.category?.label || "Gig"} posted`,
        s: subtitle,
        d: statusLabel,
        pos: g.status === "completed",
        expired: isExpired && g.status !== "completed",
        time: new Date(g.created_at).getTime(),
        gigId: g.id,
      };
    }),
  ].sort((a, b) => b.time - a.time);

  return (
    <>
      <div className="page fadein">
        <div className="topbar">
          <button
            className="btn bg-btn bico"
            onClick={() =>
              profileBackTarget ? navigate(profileBackTarget, { replace: true }) : navigate("/")
            }
          >
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <div className="tlogo">
            <LogoMark />
            <Logo />
          </div>
          <div ref={profileMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="btn bg-btn bico"
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              onClick={() => {
                setProfileMenuOpen((o) => {
                  const next = !o;
                  if (next) {
                    setProfileMenuShow(true);
                    setProfileMenuLeave(false);
                  }
                  return next;
                });
              }}
            >
              <Settings size={17} strokeWidth={2} />
            </button>
            {profileMenuShow && (
              <div
                role="menu"
                className={`profile-menu-dropdown${profileMenuLeave ? " profile-menu-dropdown--leave" : ""}`}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: 50,
                  minWidth: 208,
                  padding: 6,
                  borderRadius: "var(--r)",
                  border: "1px solid var(--bd)",
                  background: "var(--bg)",
                  boxShadow:
                    "0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
                onAnimationEnd={handleProfileMenuAnimationEnd}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/settings");
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
                  <Settings size={15} />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/profile/edit", { state: { returnTo: "/profile" } });
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
                  <Pencil size={15} />
                  Edit contacts
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/app-intro", { state: { returnTo: "/profile" } });
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
                  <BookOpen size={15} />
                  View onboarding tutorial
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    window.location.href = "mailto:support@getcampusgig.com?subject=CampusGig%20help";
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
                  <HelpCircle size={15} />
                  Help &amp; support
                </button>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "var(--fg3)",
                    fontFamily: "var(--mono)",
                    padding: "6px 10px 4px",
                  }}
                >
                  Legal
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/terms");
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
                  <FileText size={15} />
                  Terms of service
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/privacy");
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
                  <Shield size={15} />
                  Privacy policy
                </button>
                <div style={{ height: 1, background: "var(--bd)", margin: "4px 4px" }} />
                <button
                  type="button"
                  role="menuitem"
                  className="btn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: 8,
                    padding: "8px 10px",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    background: "#fef2f2",
                    color: "#dc2626",
                  }}
                >
                  {loggingOut ? <Loader size={15} className="spin" /> : <LogOut size={15} />}
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            )}
          </div>
        </div>

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
                <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
                  {profile.email}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <LevelBadge label={lvl.label} />
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
                    +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +8 marking done · +10 as taker · +2 per post
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
                    cursor: (a.gigId || a.reviewerId) ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (a.gigId) setSelectedGigId(a.gigId);
                    else if (a.reviewerId) navigate(`/users/${a.reviewerId}`);
                  }}
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
                    <UserAvatar
                      user={{ resolvedAvatarUrl: p.avatarUrl, avatar_color: p.color, first_name: p.initials?.[0], last_name: p.initials?.[1] }}
                      size={32}
                    />
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
                      <UserAvatar
                        user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile.avatar_color, first_name: profile.first_name, last_name: profile.last_name }}
                        size={32}
                      />
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
          onClose={() => {
            closeReviews();
            setTargetReviewerId(null);
          }}
          reviews={reviews}
          avgRating={parseFloat(avgRating)}
          reviewCount={reviews.length}
          isOwnProfile
          currentUserId={currentUserId}
          targetReviewerId={targetReviewerId}
        />
      )}
      {repOpen && (
        <RepDetailModal
          onClose={closeRep}
          repScore={repScore}
        />
      )}
      {selectedGigId && (
        <AlertDetailModal
          gigId={selectedGigId}
          currentUserId={currentUserId}
          onClose={() => { setSelectedGigId(null); refreshProfileData(); }}
          onStatusChange={refreshProfileData}
        />
      )}
    </>
  );
}
