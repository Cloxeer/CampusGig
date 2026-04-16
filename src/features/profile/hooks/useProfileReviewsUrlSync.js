import { useEffect } from "react";

export function useProfileReviewsUrlSync({ locationSearch, reviewsOpen, openReviews, setTargetReviewerId }) {
  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const shouldOpenReviews = params.get("reviews") === "1";
    const reviewerId = params.get("reviewer");
    setTargetReviewerId(reviewerId || null);
    if (shouldOpenReviews && !reviewsOpen) {
      openReviews();
    }
  }, [locationSearch, reviewsOpen, openReviews, setTargetReviewerId]);
}
