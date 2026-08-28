import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTimer } from "../../utils/helpers";
import { deriveGigDetailView } from "../../utils/gigDetailModel";
import { isSpotTutorialActive } from "../../utils/repPathModel";
import { getMyProfile } from "../../lib/profile";
import { queryKeys } from "../../lib/queryClient";
import { resetContext } from "../../lib/spotMemory";
import { useGigDetailExistingRequest } from "../../hooks/useGigDetailExistingRequest";
import { useGigDetailActions } from "../../hooks/useGigDetailActions";
import { useGigDetailReview } from "../../hooks/useGigDetailReview";
import { GigDetailSkeleton } from "../GigDetailSkeletons";
import GigNotFoundPanel from "../GigNotFoundPanel";
import ReportModal from "../modals/ReportModal";
import SpotCoachTour from "../SpotCoachTour";
import {
  MESSAGE_CONTACT_KEYS,
  PAY_CONTACT_KEYS,
  firstRowKey,
  buildGigDetailCoachSteps,
  deriveGigTaskLock,
} from "../../data/spotGigContactTour";
import PullToRefresh from "../PullToRefresh";
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
  onRefresh,
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
  const [requestRefreshKey, setRequestRefreshKey] = useState(0);
  const counterpartRef = useRef(null);
  const otherContactRowEls = useRef({});
  const ownContactRowEls = useRef({});
  const markDoneRef = useRef(null);
  const actionsRootRef = useRef(null);
  const pageRef = useRef(null);

  const { data: profileData } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
    enabled: Boolean(currentUserId),
  });

  const meta = notification?.metadata || {};
  const resolvedGigId = gigIdProp || gig?.id || meta.gig_id;
  const isAuthed = Boolean(currentUserId);
  const isOwnGig = Boolean(currentUserId && gig?.poster?.id === currentUserId);

  useEffect(() => {
    setRequestedLocally(false);
  }, [resolvedGigId]);

  useEffect(() => {
    if (!resolvedGigId) return;
    resetContext(`gig-contact-${resolvedGigId}`);
  }, [resolvedGigId]);

  const { existingRequest, checkingRequest } = useGigDetailExistingRequest(resolvedGigId, {
    enabled: Boolean(resolvedGigId && gig && !isOwnGig && isAuthed),
    refreshKey: requestRefreshKey,
  });

  async function handleRefresh() {
    setRequestRefreshKey((n) => n + 1);
    await onRefresh?.();
  }

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

  const [coachLayout, setCoachLayout] = useState(0);
  useEffect(() => {
    if (!model?.showContactInfo) return undefined;
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setCoachLayout((n) => n + 1));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [model?.showContactInfo, resolvedGigId]);

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
        <PullToRefresh
          className="scroll scroll--nav-pad scroll--fine-scrollbar"
          onRefresh={onRefresh}
        >
          <div className="gig-detail-error-panel">
            <div>Could not load gig details.</div>
            {onRefresh && (
              <button type="button" className="btn bp bfull" style={{ maxWidth: 280 }} onClick={() => onRefresh()}>
                Try again
              </button>
            )}
          </div>
        </PullToRefresh>
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
  const taskLock = deriveGigTaskLock(gig, Date.now());
  const isTaker = model.role === "requester";
  const showContactCoach =
    Boolean(model.showContactInfo) &&
    (model.phase === "active" || model.phase === "done") &&
    Boolean(profileData?.profile) &&
    isSpotTutorialActive(profileData.profile.rep_score);

  const counterpart = isTaker ? model.poster : model.requesterUser;
  const messageEls = isTaker ? otherContactRowEls : ownContactRowEls;
  const payEls = isTaker ? ownContactRowEls : otherContactRowEls;
  const messageKey = firstRowKey(new Set(Object.keys(messageEls.current)), MESSAGE_CONTACT_KEYS);
  const payKey = firstRowKey(new Set(Object.keys(payEls.current)), PAY_CONTACT_KEYS);
  const coachSteps = showContactCoach
    ? buildGigDetailCoachSteps({
        role: model.role,
        counterpartName: counterpart?.first_name,
        hasPerson: Boolean(counterpart),
        hasMessage: Boolean(messageKey),
        hasPay: Boolean(payKey),
        hasMarkDone: model.phase === "active" && model.role === "poster",
        hasTakerWait: model.phase === "active" && isTaker,
      }).map((step) => ({
        ...step,
        getEl: () => {
          if (step.key === "person") return counterpartRef.current;
          if (step.key === "message") return messageEls.current[messageKey] || null;
          if (step.key === "pay") return payEls.current[payKey] || null;
          if (step.key === "done") {
            return isTaker ? actionsRootRef.current : markDoneRef.current || actionsRootRef.current;
          }
          return null;
        },
      }))
    : [];

  return (
    <>
      <div className="page fadein gig-detail-page" ref={pageRef}>
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

        <PullToRefresh
          className="scroll scroll--nav-pad scroll--fine-scrollbar"
          onRefresh={onRefresh ? handleRefresh : undefined}
        >
          {model.canPosterDelete && (
            <div className="gig-detail-poster-hint">
              <strong>Your gig.</strong> You can edit details or delete this post until someone accepts it.
            </div>
          )}

          <GigDetailInfo gig={gig} model={model} tick={tick} />
          <GigDetailPeople model={model} onViewProfile={handleViewProfile} counterpartRef={counterpartRef} />

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

          <GigDetailContacts model={model} otherRowEls={otherContactRowEls} ownRowEls={ownContactRowEls} />

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
            taskLock={taskLock}
            markDoneRef={markDoneRef}
            actionsRootRef={actionsRootRef}
            onReview={() => {
              if (review.disabled) return;
              navigate(
                `/profile/${model.revieweeForReview}?reviews=1&gig=${encodeURIComponent(gig.id)}`,
                { state: { returnTo: `/gig/${resolvedGigId}` } }
              );
            }}
            onReviewAfterComplete={() => {
              if (!model.revieweeForReview || !gig?.id) return;
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
        </PullToRefresh>

        <SpotCoachTour
          enabled={showContactCoach && coachLayout > 0 && coachSteps.length > 0}
          chatId={`gig-contact-${resolvedGigId}`}
          steps={coachSteps}
          hostRef={pageRef}
        />
      </div>

      {reportOpen && gig?.id && (
        <ReportModal subjectType="gig" gigId={gig.id} onClose={() => setReportOpen(false)} />
      )}
    </>
  );
}
