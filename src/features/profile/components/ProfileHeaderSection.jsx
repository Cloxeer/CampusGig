import LevelBadge from "../../../components/LevelBadge";
import UserAvatar from "../../../components/UserAvatar";
import Stars from "../../../components/Stars";
import ProfileReviewsBlockSkeleton from "./ProfileReviewsBlockSkeleton";

export default function ProfileHeaderSection({
  profile,
  avatarUrl,
  fullName,
  lvl,
  avgRating,
  reviews,
  openReviews,
  reviewsLoading,
  isOwnProfile = true,
  hasPendingReview = false,
  myReviewsToThemLength = 0,
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
      <UserAvatar
        user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile.avatar_color, first_name: profile.first_name, last_name: profile.last_name }}
        size="xl"
        style={{ border: "2px solid var(--bd)" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 2 }}>{fullName}</div>
        {isOwnProfile ? (
          <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
            {profile.email}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: isOwnProfile ? 0 : 4 }}>
          <LevelBadge label={lvl.label} />
        </div>
      </div>
      {reviewsLoading ? (
        <ProfileReviewsBlockSkeleton />
      ) : (
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
          {isOwnProfile ? (
            <div style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>tap to view</div>
          ) : (hasPendingReview || myReviewsToThemLength > 0) ? (
            <div style={{ fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 600 }}>
              {hasPendingReview ? "Tap to review" : "Tap for reviews"}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
