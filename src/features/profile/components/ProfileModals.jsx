import ReviewSheetModal from "../../../components/modals/ReviewSheetModal";
import RepDetailModal from "../../../components/modals/RepDetailModal";
import AlertDetailModal from "../../../components/modals/AlertDetailModal";

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
  selectedGigId,
  onCloseGigModal,
  onGigStatusChange,
}) {
  return (
    <>
      {reviewsOpen && (
        <ReviewSheetModal
          onClose={onCloseReviews}
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
          onClose={onCloseGigModal}
          onStatusChange={onGigStatusChange}
        />
      )}
    </>
  );
}
