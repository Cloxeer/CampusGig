import { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { queryClient, queryKeys } from "../lib/queryClient";
import { safeAppReturnTo } from "../hooks/useModalParam";
import { navigateBack } from "../utils/navBack";
import { useGigDetailQuery } from "../hooks/useGigDetailQuery";
import GigDetailView from "../components/gigDetail/GigDetailView";

/**
 * Unified gig detail page (browse / request / manage).
 */
export default function OpenGig({ currentUserId }) {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const notification = location.state?.notification || null;

  const { data: detailData, isPending: detailPending, isError: detailError, refetch } = useGigDetailQuery(gigId);

  const gig = detailData?.gig ?? null;
  const requests = detailData?.requests ?? [];

  function handleClose() {
    const r = safeAppReturnTo(location.state);
    navigateBack(navigate, r || "/");
  }

  function handleStatusChange() {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  }

  useEffect(() => {
    if (!gigId) return;
    if (detailPending) return;
    if (detailError) return;
    if (gig !== null) return;
    const r = safeAppReturnTo(location.state);
    navigateBack(navigate, r || "/");
  }, [gigId, detailPending, detailError, gig, navigate, location.state]);

  return (
    <GigDetailView
      gigId={gigId}
      gig={gig}
      requests={requests}
      loading={Boolean(gigId) && detailPending && gig == null}
      fetchError={detailError}
      onRetry={() => refetch()}
      notification={notification}
      currentUserId={currentUserId}
      onClose={handleClose}
      onStatusChange={handleStatusChange}
      onGigDeleted={() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
      }}
    />
  );
}
