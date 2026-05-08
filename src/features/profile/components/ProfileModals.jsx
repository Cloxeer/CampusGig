import ReviewSheetModal from "../../../components/modals/ReviewSheetModal";

export default function ProfileModals({
  reviewsOpen,
  onCloseReviews,
  reviews,
  avgRating,
  currentUserId,
  targetReviewerId,
  onReviewerPress,
}) {
  return (
    <>
      {reviewsOpen && (
        <ReviewSheetModal
          onClose={onCloseReviews}
          onReviewerPress={onReviewerPress}
          reviews={reviews}
          avgRating={parseFloat(avgRating)}
          reviewCount={reviews.length}
          isOwnProfile
          currentUserId={currentUserId}
          targetReviewerId={targetReviewerId}
        />
      )}
    </>
  );
}
