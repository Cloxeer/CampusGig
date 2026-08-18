import { QueryClient } from "@tanstack/react-query";

/** Stale time for gig detail queries (open-gig modal + alert detail). */
export const GIG_DETAIL_STALE_MS = 5 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  myProfile: ["myProfile"],
  openGigs: ["openGigs"],
  notifications: ["notifications"],
  unreadCount: ["unreadCount"],
  myReviews: ["myReviews"],
  myGigStats: ["myGigStats"],
  campusRank: ["campusRank"],
  totalUsers: ["totalUsers"],
  leaderboard: (limit) => ["leaderboard", limit],
  myActivity: ["myActivity"],
  accountDeletion: ["accountDeletion"],
  /** Public marketing stats on the welcome/splash screen (get_public_stats RPC). */
  publicStats: ["publicStats"],
  /** Public `/profile/:userId` bundle (profile + reviews + activity + stats). */
  userProfilePage: (userId) => ["userProfilePage", userId],
  /** Full gig + requests for unified gig detail page (getGigDetail). */
  gigDetail: (gigId) => ["gigDetail", gigId],
  /** Whether the current user already left a review for reviewee on this gig (getExistingReview). */
  existingReview: (gigId, revieweeId) => ["existingReview", gigId, revieweeId],
};
