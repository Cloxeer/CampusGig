import { useQuery } from "@tanstack/react-query";
import {
  getMyProfile,
  getMyReviews,
  getMyGigStats,
  getCampusRank,
  getTotalUsers,
  getLeaderboard,
  getMyActivity,
  getAvatarUrl,
  getUserProfilePageData,
} from "../../../lib/profile";
import { queryKeys } from "../../../lib/queryClient";

const STATS_STALE_TIME = 5 * 60 * 1000;
const USER_PROFILE_STALE_MS = 5 * 60 * 1000;

/**
 * @param {string | undefined} routeUserId - from `/profile/:userId`; undefined on `/profile` (self).
 */
export function useProfilePageQueries(routeUserId) {
  const isOtherProfile = Boolean(routeUserId);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
    enabled: !isOtherProfile,
  });

  const profile = profileData?.profile || null;

  const { data: reviewsData, isPending: reviewsPending } = useQuery({
    queryKey: queryKeys.myReviews,
    queryFn: getMyReviews,
    enabled: !isOtherProfile && !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: gigStatsData } = useQuery({
    queryKey: queryKeys.myGigStats,
    queryFn: getMyGigStats,
    enabled: !isOtherProfile && !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: rankData } = useQuery({
    queryKey: queryKeys.campusRank,
    queryFn: () => getCampusRank(profile?.rep_score || 0),
    enabled: !isOtherProfile && !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: totalUsersData } = useQuery({
    queryKey: queryKeys.totalUsers,
    queryFn: getTotalUsers,
    enabled: !isOtherProfile && !!profile,
    staleTime: 10 * 60 * 1000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: queryKeys.leaderboard(100),
    queryFn: () => getLeaderboard(100),
    enabled: !isOtherProfile && !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const { data: activityData, isPending: activityPending } = useQuery({
    queryKey: queryKeys.myActivity,
    queryFn: getMyActivity,
    enabled: !isOtherProfile && !!profile,
    staleTime: STATS_STALE_TIME,
  });

  const {
    data: otherPageData,
    isPending: otherPending,
  } = useQuery({
    queryKey: queryKeys.userProfilePage(routeUserId),
    queryFn: () => getUserProfilePageData(routeUserId),
    enabled: isOtherProfile,
    staleTime: USER_PROFILE_STALE_MS,
  });

  if (isOtherProfile) {
    const op = otherPageData;
    const otherProfile = op?.profile ?? null;
    const reviews = op?.reviews ?? [];
    const avatarUrl = op?.avatarUrl ?? null;
    const firstPendingGigId = op?.firstPendingGigId ?? null;
    const hasPendingReview = op?.hasPendingReview ?? false;
    const eligiblePendingGigIds = op?.eligiblePendingGigIds ?? [];
    const hasExpiredReviewOpportunity = op?.hasExpiredReviewOpportunity ?? false;
    const myReviewsToThem = op?.myReviewsToThem ?? [];
    const userActivity = op?.userActivity ?? { postedGigs: [], completedGigs: [] };
    const gigStats = op?.gigStats ?? { completed: 0, posted: 0 };
    const rank = op?.rank ?? null;
    const totalUsers = op?.totalUsers ?? 0;

    return {
      mode: "other",
      loading: otherPending,
      profile: otherProfile,
      reviews,
      reviewsPending: false,
      gigStats,
      rank,
      totalUsers,
      leaderboard: [],
      activity: { completedGigs: [], receivedReviews: [], postedGigs: [] },
      activityPending: false,
      avatarUrl,
      firstPendingGigId,
      hasPendingReview,
      eligiblePendingGigIds,
      hasExpiredReviewOpportunity,
      myReviewsToThem,
      userActivity,
    };
  }

  const reviews = reviewsData?.reviews || [];
  const gigStats = gigStatsData || { completed: 0, posted: 0 };
  const rank = rankData?.rank || null;
  const totalUsers = totalUsersData?.total || 0;
  const leaderboard = leaderboardData?.leaderboard || [];
  const activity = activityData || { completedGigs: [], receivedReviews: [], postedGigs: [] };
  const avatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;

  const loading = profilePending;

  return {
    mode: "self",
    loading,
    profile,
    reviews,
    reviewsPending,
    gigStats,
    rank,
    totalUsers,
    leaderboard,
    activity,
    activityPending,
    avatarUrl,
    firstPendingGigId: null,
    hasPendingReview: false,
    eligiblePendingGigIds: [],
    hasExpiredReviewOpportunity: false,
    myReviewsToThem: [],
    userActivity: { postedGigs: [], completedGigs: [] },
  };
}
