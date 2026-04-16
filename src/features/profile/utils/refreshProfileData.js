import { queryClient, queryKeys } from "../../../lib/queryClient";

/** @param {string} [otherUserId] — when set, only refreshes that public profile bundle (legacy UserProfile behavior). */
export function refreshProfileData(otherUserId) {
  if (otherUserId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfilePage(otherUserId) });
    return;
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
  queryClient.invalidateQueries({ queryKey: queryKeys.myGigStats });
  queryClient.invalidateQueries({ queryKey: queryKeys.myActivity });
  queryClient.invalidateQueries({ queryKey: queryKeys.campusRank });
  queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard(100) });
  queryClient.invalidateQueries({ queryKey: queryKeys.totalUsers });
  queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
}
