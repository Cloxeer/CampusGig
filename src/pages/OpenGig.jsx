import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOpenGigs, getGigById, normalizeGig, requestGig } from "../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../lib/queryClient";
import { useTimer } from "../utils/helpers";
import { safeAppReturnTo } from "../hooks/useModalParam";
import GigDetailModal from "../components/modals/GigDetailModal";

/**
 * Open-gig marketplace drill-in (browse / request). Lives outside NavLayout so
 * `.shell-view > .page > .scroll` matches session shell flex rules.
 */
export default function OpenGig({ currentUserId }) {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [requested, setRequested] = useState(false);
  const tick = useTimer();

  useEffect(() => {
    setRequested(false);
  }, [gigId]);

  const { data: gigsData, isPending: gigsPending } = useQuery({
    queryKey: queryKeys.openGigs,
    queryFn: getOpenGigs,
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  const gigs = useMemo(() => (gigsData?.gigs || []).map(normalizeGig), [gigsData]);
  const listGig = useMemo(() => {
    if (!gigId) return undefined;
    if (gigsPending) return undefined;
    return gigs.find((g) => g.id === gigId) ?? null;
  }, [gigId, gigsPending, gigs]);

  const { data: modalGig, isPending: gigModalPending } = useQuery({
    queryKey: queryKeys.gigById(gigId),
    queryFn: async () => {
      const { gig } = await getGigById(gigId);
      return gig ?? null;
    },
    enabled: Boolean(gigId),
    staleTime: GIG_DETAIL_STALE_MS,
    placeholderData: listGig != null ? listGig : undefined,
  });

  function handleClose() {
    const r = safeAppReturnTo(location.state);
    if (r) navigate(r, { replace: true });
    else navigate(-1);
  }

  useEffect(() => {
    if (!gigId) return;
    if (gigsPending) return;
    if (listGig !== null) return;
    if (!gigModalPending && modalGig === null) {
      const r = safeAppReturnTo(location.state);
      if (r) navigate(r, { replace: true });
      else navigate(-1);
    }
  }, [gigId, gigsPending, listGig, gigModalPending, modalGig, navigate, location.state]);

  return (
    <GigDetailModal
      asPage
      gig={modalGig}
      loading={Boolean(gigId) && gigModalPending && modalGig == null}
      tick={tick}
      requested={requested}
      currentUserId={currentUserId}
      onRequest={async () => {
        const result = await requestGig(gigId);
        if (!result.error) {
          setRequested(true);
          queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
          queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigId) });
          return { error: null };
        }
        return result;
      }}
      onClose={handleClose}
      onViewProfile={(userId) =>
        navigate(`/profile/${userId}`, {
          state: { returnTo: `/gig/${gigId}` },
        })
      }
      onGigDeleted={() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
        queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigId) });
      }}
    />
  );
}
