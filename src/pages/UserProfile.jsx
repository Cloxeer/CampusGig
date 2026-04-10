import { useState, useEffect } from "react";
import { Award, Loader } from "lucide-react";
import { getProfileById, getReviewsForUser, getAvatarUrl, getCompletedGigsBetweenUsers, getExistingReview } from "../lib/profile";
import { getLevel } from "../utils/helpers";
import TopBar from "../components/TopBar";
import LevelBadge from "../components/LevelBadge";
import Stars from "../components/Stars";
import ReviewSheetModal from "../components/modals/ReviewSheetModal";

export default function UserProfile({ setScreen, userId }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showReviews, setShowReviews] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewGigId, setReviewGigId] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    setCanReview(false);
    setAlreadyReviewed(false);
    setReviewGigId(null);

    const { profile: p } = await getProfileById(userId);
    setProfile(p);

    if (p) {
      if (p.avatar_url) {
        const url = getAvatarUrl(p.avatar_url);
        if (url) setAvatarUrl(url);
      }

      const [reviewsRes, gigsRes, existingRes] = await Promise.all([
        getReviewsForUser(userId),
        getCompletedGigsBetweenUsers(userId),
        getExistingReview(userId),
      ]);

      setReviews(reviewsRes.reviews);

      if (existingRes.review) {
        setAlreadyReviewed(true);
      } else if (gigsRes.gigs.length > 0) {
        setCanReview(true);
        setReviewGigId(gigsRes.gigs[0].id);
      }
    }
    setLoading(false);
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
      <div className="page fadein">
        <TopBar title="Profile" onBack={() => setScreen("home")} />
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
        <TopBar title={fullName} onBack={() => setScreen("home")} />

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
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                  <LevelBadge label={lvl.label} />
                </div>
              </div>
              <div
                style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                onClick={() => setShowReviews(true)}
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
                <div style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>tap to view</div>
              </div>
            </div>

            <div className="rep-card" style={{ marginBottom: 16 }}>
              <div className="rc-ey">Rep Score</div>
              <div className="rc-row">
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span className="rc-score">{repScore}</span>
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
                  <span key={l} className={`rc-lbl ${lvl.label === l ? "cur" : ""}`}>{l}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: "-.01em" }}>
              Reviews ({reviews.length})
            </div>
            {reviews.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
                No reviews yet.
              </div>
            ) : (
              reviews.slice(0, 5).map((r, idx) => {
                const reviewer = r.reviewer || {};
                const rInitials = `${reviewer.first_name?.charAt(0) || "?"}${reviewer.last_name?.charAt(0) || ""}`.toUpperCase();
                return (
                  <div
                    key={r.id || idx}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "11px 0",
                      borderBottom: idx < Math.min(reviews.length, 5) - 1 ? "1px solid var(--bd)" : "none",
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
            {reviews.length > 5 && (
              <button
                className="btn bo bfull bsm"
                style={{ marginTop: 8 }}
                onClick={() => setShowReviews(true)}
              >
                View all {reviews.length} reviews
              </button>
            )}

            {!alreadyReviewed && canReview && (
              <button
                className="btn bp bfull"
                style={{ marginTop: 16 }}
                onClick={() => setShowReviews(true)}
              >
                Leave a review
              </button>
            )}
            {alreadyReviewed && (
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
                  textAlign: "center",
                }}
              >
                You've already reviewed this user.
              </div>
            )}
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>

      {showReviews && (
        <ReviewSheetModal
          onClose={() => setShowReviews(false)}
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviews.length}
          isOwnProfile={false}
          revieweeId={userId}
          gigId={reviewGigId}
          canReview={canReview}
          alreadyReviewed={alreadyReviewed}
          onReviewSubmitted={() => {
            setShowReviews(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
