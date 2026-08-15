import { useQuery } from "@tanstack/react-query";
import { getExistingReview, isReviewWindowOpen } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";

export function useGigDetailReview({ gigId, gig, revieweeForReview, currentUserId }) {
  const enabled = Boolean(
    gigId &&
    gig?.status === "completed" &&
    currentUserId &&
    revieweeForReview
  );

  const query = useQuery({
    queryKey: queryKeys.existingReview(gigId, revieweeForReview),
    queryFn: async () => {
      const r = await getExistingReview(revieweeForReview, gigId);
      if (r.error) throw new Error(r.error.message || "Failed to load review status");
      return r;
    },
    enabled,
  });

  const showReviewButton = enabled && Boolean(gig?.taker?.id);
  const reviewWindowOpen = showReviewButton && gig ? isReviewWindowOpen(gig) : false;
  const alreadyLeftReview = Boolean(query.data?.review?.id);

  let buttonTitle = "Leave a review for this gig";
  if (query.isPending) buttonTitle = "Checking review status…";
  else if (query.isError) buttonTitle = "Could not load review status";
  else if (alreadyLeftReview) buttonTitle = "You already left a review for this gig";
  else if (!reviewWindowOpen) buttonTitle = "The review window for this gig has closed";

  let caption = null;
  if (showReviewButton && !query.isPending) {
    if (query.isError) caption = "Could not load review status. Try again later.";
    else if (alreadyLeftReview) caption = "You already left a review for this gig.";
    else if (!reviewWindowOpen && !alreadyLeftReview) {
      caption = "The review window for this gig has closed.";
    }
  }

  const disabled =
    showReviewButton &&
    (query.isPending || query.isError || alreadyLeftReview || !reviewWindowOpen);

  return {
    showReviewButton,
    disabled,
    buttonTitle,
    caption,
    isPending: query.isPending,
  };
}
