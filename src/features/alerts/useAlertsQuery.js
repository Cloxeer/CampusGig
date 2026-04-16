import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { fetchAlertsBundle } from "./alertsQuery";

export function useAlertsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchAlertsBundle,
    staleTime: 60_000,
  });
}
