import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTimer } from "../../utils/helpers";
import { deriveGigDetailView } from "../../utils/gigDetailModel";
import { useGigDetailExistingRequest } from "../../hooks/useGigDetailExistingRequest";
import { useGigDetailActions } from "../../hooks/useGigDetailActions";
import { useGigDetailReview } from "../../hooks/useGigDetailReview";
import { GigDetailSkeleton } from "../GigDetailSkeletons";
import GigNotFoundPanel from "../GigNotFoundPanel";
import ReportModal from "../modals/ReportModal";
import GigDetailTopBar from "./GigDetailTopBar";
import GigDetailInfo from "./GigDetailInfo";
import GigDetailPeople from "./GigDetailPeople";
import GigDetailContacts from "./GigDetailContacts";
import GigDetailLockCallout from "./GigDetailLockCallout";
import GigDetailActions from "./GigDetailActions";

function revieweeIdFromGig(gig, currentUserId) {
  const poster = gig?.poster || {};
  const taker = gig?.taker || null;
  if (!currentUserId || !poster.id || !taker?.id) return null;
  if (currentUserId === poster.id) return taker.id;
  if (currentUserId === taker.id) return poster.id;
  return null;
}

export default function GigDetailView({
  gig,
  requests = [],
  loading = false,
  fetchError = false,
  onRetry,
  notification,
  currentUserId,
  onClose,
  onStatusChange,
  onGigDeleted,
  gigId: gigIdProp,
}) {
  const navigate = useNavigate();
  const tick = useTimer();
  const [reportOpen, setReportOpen] = useState(false);
  const [requestedLocally, setRequestedLocally] = useState(false);

  const meta = notification?.metadata || {};
  const resolvedGigId = gigIdProp || gig?.id || meta.gig_id;
  const isAuthed = Boolean(currentUserId);
  const isOwnGig = Boolean(currentUserId && gig?.poster?.id === currentUserId);

  useEffect(() => {
    setRequestedLocally(false);
  }, [resolvedGigId]);

  const { existingRequest, checkingRequest } = useGigDetailExistingRequest(resolvedGigId, {
    enabled: Boolean(resolvedGigId && gig && !isOwnGig && isAuthed),
  });

  const actions = useGigDetailActions({
    gigId: resolvedGigId,
    onStatusChange,
    onGigDeleted,
    onClose,
  });

  const revieweeForReview = revieweeIdFromGig(gig, currentUserId);
  const review = useGigDetailReview({
    gigId: resolvedGigId,
    gig,
    revieweeForReview,
    currentUserId,
  });

  const model = useMemo(() => {
    if (!gig) return null;
    return deriveGigDetailView({
      gig,
      requests,
      currentUserId,
      existingRequest,
      notificationMeta: meta,
      requestedLocally,
    });
  }, [gig, requests, currentUserId, existingRequest, meta, requestedLocally]);

  if (loading) {
    return <GigDetailSkeleton onClose={onClose} />;
  }

  if (!resolvedGigId) {
    return (
      <div className="page fadein">
        <GigNotFoundPanel onBack={onClose} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page fadein">
        <GigDetailTopBar onClose={onClose} />
        <div className="gig-detail-error-panel">
          <div>Could not load gig details.</div>
          {onRetry && (
            <button type="button" className="btn bp bfull" style={{ maxWidth: 280 }} onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!gig || !model) {
    return (
      <div className="page fadein">
        <GigNotFoundPanel onBack={onClose} />
      </div>
    );
  }

  const revieweeFirstName = review.showReviewButton
    ? `${(currentUserId === model.poster.id ? model.taker : model.poster).first_name || "them"}`.trim()
    : "";

  function handleViewProfile(userId) {
    navigate(`/profile/${userId}`, {
      state: { returnTo: `/gig/${resolvedGigId}` },
    });
  }

  async function handleRequest() {
    const result = await actions.request();
    if (result.ok) setRequestedLocally(true);
  }

  const actionsWithRequest = { ...actions, request: handleRequest };

  return (
    <>
      <div className="page fadein">
        <GigDetailTopBar
          onClose={onClose}
          canReport={model.canReport}
          onReport={() => setReportOpen(true)}
          canPosterDelete={model.canPosterDelete}
          gigId={gig.id}
          onEdit={(id) => navigate(`/post?edit=${id}`)}
          onDelete={() => actions.deleteGig(gig.id)}
          deleting={actions.isLoading("delete")}
        />

        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
          {model.canPosterDelete && (
            <div className="gig-detail-poster-hint">
              <strong>Your gig.</strong> You can edit details or delete this post until someone accepts it.
            </div>
          )}

          <GigDetailInfo gig={gig} model={model} tick={tick} />
          <GigDetailPeople model={model} onViewProfile={handleViewProfile} />

          {model.showPaymentLockCallout && (
            <div className="gig-detail-lock-wrap">
              <GigDetailLockCallout
                message={
                  model.phase === "discover"
                    ? "Payment details shared only after both parties accept."
                    : "Contact info is shared only after the poster accepts."
                }
              />
            </div>
          )}

          <GigDetailContacts model={model} />

          <GigDetailActions
            model={model}
            checkingRequest={checkingRequest}
            actions={actionsWithRequest}
            review={review}
            gig={gig}
            gigId={resolvedGigId}
            isAuthed={isAuthed}
            onRequireAuth={() => navigate("/welcome")}
            revieweeFirstName={revieweeFirstName}
            onReview={() => {
              if (review.disabled) return;
              navigate(
                `/profile/${model.revieweeForReview}?reviews=1&gig=${encodeURIComponent(gig.id)}`,
                { state: { returnTo: `/gig/${resolvedGigId}` } }
              );
            }}
          />

          <div style={{ padding: "0 20px 8px" }}>
            <button type="button" className="btn bo bfull" onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>

      {reportOpen && gig?.id && (
        <ReportModal subjectType="gig" gigId={gig.id} onClose={() => setReportOpen(false)} />
      )}
    </>
  );
}
