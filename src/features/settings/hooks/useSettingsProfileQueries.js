import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getMyDeletionRequest } from "../../../lib/profile";
import { queryKeys } from "../../../lib/queryClient";
import { formatGraceEndsAt, isPendingDeletion } from "../deletionSchedule";

export function useSettingsProfileQueries() {
  const { data: profileData, isPending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });
  const profile = profileData?.profile || null;
  const email = profile?.email || "";

  const { data: deletionData } = useQuery({
    queryKey: queryKeys.accountDeletion,
    queryFn: getMyDeletionRequest,
    enabled: !!profile,
    staleTime: 60_000,
    retry: false,
  });
  const deletionReq = deletionData?.request;
  const pendingDeletion = isPendingDeletion(deletionReq);
  const graceEndsLabel = formatGraceEndsAt(deletionReq?.grace_ends_at);

  return {
    profile,
    email,
    isPending,
    deletionReq,
    isPendingDeletion: pendingDeletion,
    graceEndsLabel,
  };
}
