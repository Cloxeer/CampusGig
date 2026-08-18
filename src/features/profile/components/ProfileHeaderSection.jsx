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
  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
      <UserAvatar
        user={{
          id: profile?.id,
          resolvedAvatarUrl: avatarUrl,
          avatar_color: profile.avatar_color,
          first_name: profile.first_name,
          last_name: profile.last_name,
          equipped_border: profile.equipped_border,
        }}
        size="xl"
        style={{ border: "2px solid var(--bd)" }}
        zoomable
        withCosmetics={isOwnProfile}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 2 }}>{fullName}</div>
        {joinedLabel && (
          <div style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", marginBottom: 6, marginTop: 2 }}>
            Joined {joinedLabel}
          </div>
        )}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <LevelBadge label={lvl.label} userId={profile?.id} equippedTagId={profile?.equipped_tag} />
        </div>
      </div>
      {reviewsLoading ? (
        <ProfileReviewsBlockSkeleton />
      ) : (
        <div
          style={{ textAlign: "right", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
          onClick={() => openReviews()}
        >
          {reviews.length > 0 ? (
            <>
              <Stars rating={parseFloat(avgRating)} size={13} />
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "-.03em", marginTop: 2 }}>
                {avgRating}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                {`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", padding: "6px 0 2px" }}>
              No reviews
            </div>
          )}
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
