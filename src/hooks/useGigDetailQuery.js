import { useQuery } from "@tanstack/react-query";
import { getGigDetail } from "../lib/profile";
import { queryKeys, GIG_DETAIL_STALE_MS } from "../lib/queryClient";

function parseGigDetailResult(r) {
  if (r.error) {
    const msg = String(r.error.message || "");
    const details = String(r.error.details || "");
    const hint = String(r.error.hint || "");
    const code = r.error.code;
    const combined = `${msg} ${details} ${hint}`.toLowerCase();
    const looksMissingRow =
      code === "PGRST116" ||
      msg.includes("No rows") ||
      msg.includes("JSON object") ||
      msg.includes("0 rows") ||
      combined.includes("multiple (or no) rows") ||
      combined.includes("coerce the result to a single json object");
    if (looksMissingRow) {
      return { gig: null, requests: [], notFound: true };
    }
    throw r.error;
  }
  if (!r.gig) return { gig: null, requests: [], notFound: true };
  return { gig: r.gig, requests: r.requests || [], notFound: false };
}

export function useGigDetailQuery(gigId) {
  return useQuery({
    queryKey: queryKeys.gigDetail(gigId),
    queryFn: async () => parseGigDetailResult(await getGigDetail(gigId)),
    enabled: Boolean(gigId),
    staleTime: GIG_DETAIL_STALE_MS,
  });
}
