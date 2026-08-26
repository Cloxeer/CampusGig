import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpenGigs, getCompletedGigs, normalizeGig } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";

export function useOpenGigsQuery() {
  const { data: gigsData, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.openGigs,
    queryFn: getOpenGigs,
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  const gigs = useMemo(() => (gigsData?.gigs || []).map(normalizeGig), [gigsData]);

  return { gigs, isPending, isError, error, refetch };
}

export function useCompletedGigsQuery() {
  const { data: gigsData, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.completedGigs,
    queryFn: getCompletedGigs,
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  const gigs = useMemo(() => (gigsData?.gigs || []).map(normalizeGig), [gigsData]);

  return { gigs, isPending, isError, error, refetch };
}
