import { useEffect } from "react";

export function useProfileReviewsUrlSync({
  locationSearch,
  reviewsOpen,
  openReviews,
  setTargetReviewerId,
  setDeepLinkGigId,
}) {
  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const shouldOpenReviews = params.get("reviews") === "1";
    const reviewerId = params.get("reviewer");
    const gigId = params.get("gig");
    setTargetReviewerId(reviewerId || null);
    setDeepLinkGigId(gigId || null);
    if (shouldOpenReviews && !reviewsOpen) {
      openReviews();
    }
  }, [locationSearch, reviewsOpen, openReviews, setTargetReviewerId, setDeepLinkGigId]);
}
