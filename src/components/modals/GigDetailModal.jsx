import { useState, useEffect } from "react";
import { MapPin, Clock, FileText, Lock, CheckCircle, Check, Timer, Loader } from "lucide-react";
import LevelBadge from "../LevelBadge";
import Stars from "../Stars";
import { elapsed, countdown } from "../../utils/helpers";
import { getMyRequestForGig, deleteMyGig } from "../../lib/profile";

export default function GigDetailModal({ gig, tick, requested, onRequest, onClose, onViewProfile, currentUserId, onGigDeleted }) {
  const cd = countdown(gig.deadline);
  const taskDesc = gig.description || gig.notes || "No additional details.";
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const isOwnGig = currentUserId && gig.posterId === currentUserId;
  const canPosterDelete = isOwnGig && (gig.status === "open" || gig.status === "requested");

  useEffect(() => {
    setDeleteError(null);
  }, [gig.id]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!gig?.id || isOwnGig || !currentUserId) {
        setExistingRequest(null);
        setCheckingRequest(false);
        return;
      }
      setCheckingRequest(true);
      const { request } = await getMyRequestForGig(gig.id);
      if (!cancelled) {
        setExistingRequest(request);
        setCheckingRequest(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [gig.id, isOwnGig, currentUserId]);

  const showAlreadyRequested =
    requested ||
    existingRequest?.status === "pending" ||
    existingRequest?.status === "accepted";
  const showRejected = existingRequest?.status === "rejected";

  const detailRows = [
    { icon: <MapPin size={14} />, label: "Location", val: gig.loc },
  ];
  if (gig.deadline) {
    detailRows.push({
      icon: <Timer size={14} />,
      label: "Time remaining",
      val: cd ? cd.text : "—",
      expired: cd?.expired,
    });
  } else if (gig.eta && gig.eta !== "—") {
    detailRows.push({ icon: <Clock size={14} />, label: "Est. time", val: gig.eta });
  }
  detailRows.push({ icon: <FileText size={14} />, label: "Task description", val: taskDesc });

  async function handleRequest() {
    setRequesting(true);
    setRequestError(null);
    const result = await onRequest();
    if (result?.error) {
      setRequestError(result.error.message || result.error);
    }
    setRequesting(false);
  }

  async function handleDelete() {
    if (!canPosterDelete) return;
    if (!window.confirm("Delete this gig? This can’t be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await deleteMyGig(gig.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message || "Couldn’t delete gig.");
      return;
    }
    onGigDeleted?.();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 25,
        maxWidth: 393,
        margin: "0 auto",
        background: "var(--bg)",
      }}
    >
      <div className="page fadein">
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={onClose}>
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Gig Details</span>
          {canPosterDelete ? (
            <button
              type="button"
              className="btn bg-btn bsm"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                color: "var(--err)",
                borderColor: "var(--err)",
                background: "transparent",
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 10px",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "…" : "Delete"}
            </button>
          ) : (
            <div style={{ width: 34 }} />
          )}
        </div>

        <div className="scroll" style={{ paddingBottom: 80 }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)", lineHeight: 1.4, marginBottom: 8 }}>
              {gig.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--mono)", letterSpacing: "-.04em" }}>
                {gig.price}
              </span>
              <div style={{ textAlign: "right" }}>
                {cd && !cd.expired && (
                  <div
                    key={tick}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "var(--mono)",
                      color: "var(--amber)",
                      marginBottom: 2,
                    }}
                  >
                    ⏱ {cd.text}
                  </div>
                )}
                {cd && cd.expired && (
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--err)", marginBottom: 2 }}>
                    Time ended
                  </div>
                )}
                <span style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)" }} key={`e-${tick}`}>
                  {elapsed(gig.postedAt)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {detailRows.map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--r)",
                    background: "var(--bg3)",
                    border: "1px solid var(--bd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "var(--fg3)",
                  }}
                >
                  {r.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: r.expired ? "var(--err)" : "var(--fg)",
                      fontWeight: r.expired ? 600 : 400,
                    }}
                  >
                    {r.val}
                  </div>
                </div>
              </div>
            ))}

            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
                Posted by
              </div>
              <div
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--bd)",
                  borderRadius: "var(--r)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "border-color .12s",
                }}
                onClick={() => onViewProfile?.(gig.posterId)}
              >
                {gig.avatarUrl ? (
                  <img
                    src={gig.avatarUrl}
                    alt=""
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: gig.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {gig.initials}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{gig.poster}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <LevelBadge label={gig.levelLabel} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Stars rating={gig.posterAvgRating} size={11} />
                    {gig.posterReviewCount > 0 ? (
                      <span style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                        {gig.posterAvgRating.toFixed(1)} ({gig.posterReviewCount})
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                        No reviews
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "var(--fg4)" }}>›</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--amber-bg)",
                border: "1px solid var(--amber-bd)",
                borderRadius: "var(--r)",
                padding: "10px 12px",
                fontSize: 12,
                color: "var(--amber)",
              }}
            >
              <Lock size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--mono)" }}>Payment details shared only after both parties accept.</span>
            </div>
          </div>

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {isOwnGig ? (
              <div className="callout" style={{ background: "var(--bg3)", borderColor: "var(--bd)" }}>
                <span className="ct" style={{ color: "var(--fg3)" }}>
                  This is your gig. You'll be notified when someone requests it.
                </span>
              </div>
            ) : checkingRequest ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0" }}>
                <Loader size={18} className="spin" color="var(--fg3)" />
                <span style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Checking request…</span>
              </div>
            ) : showRejected ? (
              <div className="callout" style={{ background: "var(--err-bg)", borderColor: "#fecaca" }}>
                <span className="ct" style={{ color: "var(--err)" }}>
                  <strong>Request declined.</strong> This gig is open again — you can’t send another request from this account.
                </span>
              </div>
            ) : !showAlreadyRequested ? (
              <>
                <button
                  className="btn bgreen bfull blg"
                  onClick={handleRequest}
                  disabled={requesting}
                  style={{ opacity: requesting ? 0.7 : 1 }}
                >
                  {requesting ? (
                    <Loader size={16} className="spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {requesting ? "Sending…" : "Request this gig"}
                </button>
                {requestError && (
                  <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", textAlign: "center" }}>
                    {requestError}
                  </div>
                )}
              </>
            ) : (
              <div className="callout" style={{ background: "var(--green-bg)", borderColor: "var(--green-bd)" }}>
                <div className="ci" style={{ color: "var(--green-d)" }}>
                  <Check size={13} />
                </div>
                <span className="ct" style={{ color: "var(--green-text)" }}>
                  {existingRequest?.status === "accepted" ? (
                    <>
                      <strong>You’re on this gig.</strong> Open Alerts for contact details and updates.
                    </>
                  ) : (
                    <>
                      <strong>Already requested.</strong> {gig.poster} hasn’t responded yet — check Alerts for updates.
                    </>
                  )}
                </span>
              </div>
            )}
            {deleteError && (
              <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", textAlign: "center" }}>
                {deleteError}
              </div>
            )}
            <button className="btn bo bfull" onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
