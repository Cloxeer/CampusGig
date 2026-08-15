import { CheckCircle, Check, Clock, Loader, Star, LogIn } from "lucide-react";

export default function GigDetailActions({
  model,
  checkingRequest,
  actions,
  review,
  gig,
  gigId,
  isAuthed = true,
  onRequireAuth,
  onReview,
  revieweeFirstName,
}) {
  const { phase, role, showAlreadyRequested, showRejected, posterName, pendingReq, expired } = model;

  return (
    <div className="gig-detail-actions">
      {phase === "discover" && (
        <>
          {!isAuthed ? (
            <button
              type="button"
              className="btn bp bfull blg"
              onClick={() => onRequireAuth?.()}
            >
              <LogIn size={16} /> Sign in to request
            </button>
          ) : checkingRequest ? (
            <div className="gig-detail-actions__checking">
              <Loader size={18} className="spin" color="var(--fg3)" />
              <span>Checking request…</span>
            </div>
          ) : showRejected ? (
            <div className="callout" style={{ background: "var(--err-bg)", borderColor: "#fecaca" }}>
              <span className="ct" style={{ color: "var(--err)" }}>
                <strong>Request declined.</strong> This gig is open again — you can't send another request from this account.
              </span>
            </div>
          ) : !showAlreadyRequested ? (
            <>
              <button
                type="button"
                className="btn bgreen bfull blg"
                onClick={() => actions.request()}
                disabled={actions.isLoading("request")}
                style={{ opacity: actions.isLoading("request") ? 0.7 : 1 }}
              >
                {actions.isLoading("request") ? (
                  <Loader size={16} className="spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {actions.isLoading("request") ? "Sending…" : "Request this gig"}
              </button>
            </>
          ) : (
            <div className="callout" style={{ background: "var(--green-bg)", borderColor: "var(--green-bd)" }}>
              <div className="ci" style={{ color: "var(--green-d)" }}>
                <Check size={13} />
              </div>
              <span className="ct" style={{ color: "var(--green-text)" }}>
                <strong>Already requested.</strong> {posterName} hasn't responded yet — check Alerts for updates.
              </span>
            </div>
          )}
        </>
      )}

      {phase === "poster_open" && (
        <div className="callout" style={{ background: "var(--bg3)", borderColor: "var(--bd)" }}>
          <span className="ct" style={{ color: "var(--fg3)" }}>
            This is your gig. You'll be notified when someone requests it.
          </span>
        </div>
      )}

      {phase === "awaiting" && role === "poster" && model.hasPendingRequest && pendingReq && (
        <>
          <button
            type="button"
            className="btn bgreen bfull blg"
            onClick={() => actions.accept(pendingReq.id)}
            disabled={actions.isLoading("accept")}
            style={{ opacity: actions.isLoading("accept") ? 0.6 : 1 }}
          >
            {actions.isLoading("accept") ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
            {actions.isLoading("accept") ? "Accepting…" : "Accept Request"}
          </button>
          <button
            type="button"
            className="btn bo bfull"
            onClick={() => actions.reject(pendingReq.id)}
            disabled={actions.isLoading("reject")}
          >
            Decline
          </button>
        </>
      )}

      {phase === "awaiting" && role === "requester" && (
        <div className="gig-detail-actions__status gig-detail-actions__status--amber">
          <Clock size={14} />
          Waiting for approval…
        </div>
      )}

      {phase === "active" && role === "poster" && (
        <button
          type="button"
          className="btn bp bfull blg"
          onClick={() => actions.complete(gig.id)}
          disabled={actions.isLoading("complete")}
          style={{ opacity: actions.isLoading("complete") ? 0.6 : 1 }}
        >
          {actions.isLoading("complete") ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
          {actions.isLoading("complete") ? "Completing…" : expired ? "Mark as Done Anyway" : "Mark as Done"}
        </button>
      )}

      {phase === "active" && role === "requester" && (
        <div className="gig-detail-actions__status gig-detail-actions__status--green">
          <CheckCircle size={14} />
          Active · Waiting for poster to mark done
        </div>
      )}

      {phase === "done" && (
        <div className="gig-detail-actions__status gig-detail-actions__status--green">
          <span style={{ fontSize: 16 }}>🏅</span>
          Completed
        </div>
      )}

      {review.showReviewButton && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            className="btn bp bfull"
            disabled={review.disabled}
            title={review.buttonTitle}
            onClick={onReview}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: review.disabled ? 0.65 : 1,
              cursor: review.disabled ? "not-allowed" : "pointer",
            }}
          >
            {review.isPending ? <Loader size={16} className="spin" /> : <Star size={15} strokeWidth={2} />}
            Review {revieweeFirstName}
          </button>
          {review.caption && (
            <div style={{ fontSize: 12, color: "var(--fg3)", textAlign: "center", lineHeight: 1.45 }}>
              {review.caption}
            </div>
          )}
        </div>
      )}

      {actions.error && (
        <div className="gig-detail-actions__error">{actions.error}</div>
      )}
    </div>
  );
}
