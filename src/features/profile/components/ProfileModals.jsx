import ReviewSheetModal from "../../../components/modals/ReviewSheetModal";
import RepDetailModal from "../../../components/modals/RepDetailModal";

export default function ProfileModals({
  reviewsOpen,
  onCloseReviews,
  reviews,
  avgRating,
  currentUserId,
  targetReviewerId,
  repOpen,
  closeRep,
  repScore,
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
      {repOpen && (
        <RepDetailModal
          onClose={closeRep}
          repScore={repScore}
        />
      )}
    </>
  );
}
