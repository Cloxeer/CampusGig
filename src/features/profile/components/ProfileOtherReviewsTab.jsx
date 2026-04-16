import { useRef, useEffect } from "react";
import { Star, Settings } from "lucide-react";
import UserAvatar from "../../../components/UserAvatar";
import Stars from "../../../components/Stars";

export default function ProfileOtherReviewsTab({
  reviews,
  avgRatingNum,
  fullName,
  currentUserId,
  hasPendingReview,
  hasExpiredReviewOpportunity = false,
  myReviewsToThem,
  openReviews,
  setReviewForm,
  settingsMenuReviewId,
  setSettingsMenuReviewId,
  setDeleteConfirmReviewId,
}) {
  const settingsMenuRef = useRef(null);

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
  }, [settingsMenuReviewId, setSettingsMenuReviewId]);

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ padding: "10px 0 6px", fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
        {reviews.length} review{reviews.length !== 1 ? "s" : ""} · {avgRatingNum.toFixed(1)} avg
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
                {r.text ? <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>{r.text}</div> : null}
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
      ) : hasExpiredReviewOpportunity ? (
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
            lineHeight: 1.45,
          }}
        >
          The review window has closed for the gig(s) you didn’t review in time. Skipping a review does not affect your Rep.
        </div>
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
  );
}
