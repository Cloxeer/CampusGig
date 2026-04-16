import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader, MapPin, Timer, FileText, CheckCircle, XCircle, Clock,
  Phone, AtSign, DollarSign, Smartphone, Lock, Mail, MessageCircle, Star,
} from "lucide-react";
import { getGigDetail, acceptGigRequest, rejectGigRequest, completeGig } from "../../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../../lib/queryClient";
import { getLevel, countdown, useTimer } from "../../utils/helpers";
import LevelBadge from "../LevelBadge";
import UserAvatar from "../UserAvatar";
import { AlertGigDetailSkeleton } from "../GigDetailSkeletons";

const STATUS_CONFIG = {
  requested: { label: "Pending Approval", color: "var(--amber)", bg: "var(--amber-bg)", bd: "var(--amber-bd)", dot: "#f59e0b" },
  active: { label: "Active", color: "var(--green-d)", bg: "var(--green-bg)", bd: "var(--green-bd)", dot: "#22c55e" },
  completed: { label: "Completed", color: "var(--green-d)", bg: "var(--green-bg)", bd: "var(--green-bd)", dot: "#16a34a" },
  cancelled: { label: "Cancelled", color: "var(--fg3)", bg: "var(--bg3)", bd: "var(--bd)", dot: "#a1a1aa" },
  open: { label: "Open", color: "var(--fg3)", bg: "var(--bg3)", bd: "var(--bd)", dot: "#a1a1aa" },
};

function StatusBadge({ status, expired }) {
  const displayStatus = expired && (status === "active" || status === "requested") ? "time_ended" : status;
  const cfg = displayStatus === "time_ended"
    ? { label: "Time Ended", color: "var(--err)", bg: "var(--err-bg)", bd: "#fecaca", dot: "#dc2626" }
    : (STATUS_CONFIG[status] || STATUS_CONFIG.open);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bd}`,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </div>
  );
}

function UserCard({ user, label, onClick }) {
  if (!user) return null;
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const lvl = getLevel(user.rep_score || 0);

  return (
    <div
      style={{
        flex: 1, background: "var(--bg3)", border: "1px solid var(--bd)",
        borderRadius: "var(--r)", padding: "12px 10px", textAlign: "center",
        cursor: "pointer", transition: "border-color .12s",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <UserAvatar user={user} size="lg" style={{ border: "2px solid var(--bd)" }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <LevelBadge label={lvl.label} />
      </div>
      <div style={{ fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 600 }}>View Profile ›</div>
    </div>
  );
}

const OPTIONAL_CONTACT_ORDER = [
  "venmo",
  "cashapp",
  "paypal",
  "snapchat",
  "instagram",
  "discord",
  "zelle",
  "apple_pay",
  "google_pay",
];

function sortOptionalContacts(rows, favoriteKeys) {
  const fav = Array.isArray(favoriteKeys) ? favoriteKeys : [];
  return [...rows].sort((a, b) => {
    const ai = fav.indexOf(a.key);
    const bi = fav.indexOf(b.key);
    const aFav = ai >= 0;
    const bFav = bi >= 0;
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    if (aFav && bFav) return ai - bi;
    return OPTIONAL_CONTACT_ORDER.indexOf(a.key) - OPTIONAL_CONTACT_ORDER.indexOf(b.key);
  });
}

function ContactSection({ user, label }) {
  if (!user) return null;
  const favKeys = user.contact_favorite_keys;

  const primary = [
    user.phone && { key: "phone", icon: <Phone size={13} />, label: "Phone", val: user.phone },
    user.email && { key: "email", icon: <Mail size={13} />, label: "School email", val: user.email },
  ].filter(Boolean);

  const optionalRaw = [
    user.venmo && { key: "venmo", icon: <DollarSign size={13} />, label: "Venmo", val: user.venmo },
    user.cashapp && { key: "cashapp", icon: <DollarSign size={13} />, label: "Cash App", val: user.cashapp },
    user.paypal && { key: "paypal", icon: <AtSign size={13} />, label: "PayPal", val: user.paypal },
    user.snapchat && { key: "snapchat", icon: <Smartphone size={13} />, label: "Snapchat", val: user.snapchat },
    user.instagram && { key: "instagram", icon: <AtSign size={13} />, label: "Instagram", val: user.instagram },
    user.discord && { key: "discord", icon: <MessageCircle size={13} />, label: "Discord", val: user.discord },
    user.zelle && { key: "zelle", icon: <DollarSign size={13} />, label: "Zelle", val: user.zelle },
    user.apple_pay && { key: "apple_pay", icon: <Smartphone size={13} />, label: "Apple Pay", val: user.apple_pay },
    user.google_pay && { key: "google_pay", icon: <DollarSign size={13} />, label: "Google Pay", val: user.google_pay },
  ].filter(Boolean);

  const optional = sortOptionalContacts(optionalRaw, favKeys);
  const contacts = [...primary, ...optional];

  if (contacts.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
        {label}'s info
      </div>
      <div style={{
        background: "var(--bg3)", border: "1px solid var(--bd)",
        borderRadius: "var(--r)", overflow: "hidden",
      }}>
        {contacts.map((c, i) => (
          <div key={c.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            borderTop: i > 0 ? "1px solid var(--bd)" : "none",
          }}>
            <div style={{ color: "var(--fg3)", flexShrink: 0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>{c.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlertDetailModal({ notification, gigId: gigIdProp, currentUserId, onClose, onStatusChange, asPage = false }) {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const tick = useTimer();

  const meta = notification?.metadata || {};
  const resolvedGigId = gigIdProp || meta.gig_id;

  const { data: detailData, isPending: detailPending } = useQuery({
    queryKey: queryKeys.gigAlertDetail(resolvedGigId),
    queryFn: async () => {
      const r = await getGigDetail(resolvedGigId);
      return { gig: r.gig, requests: r.requests || [] };
    },
    enabled: Boolean(resolvedGigId),
    staleTime: GIG_DETAIL_STALE_MS,
  });

  const gig = detailData?.gig ?? null;
  const requests = detailData?.requests ?? [];

  const role = meta.role || (gig && currentUserId
    ? (gig.poster?.id === currentUserId ? "poster" : "requester")
    : null);

  async function handleAccept() {
    const req = requests.find((r) => r.status === "pending") || requests[0];
    if (!req) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await acceptGigRequest(req.id);
    if (error) {
      setActionError(error.message || "Failed to accept");
      setActionLoading(false);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.gigAlertDetail(resolvedGigId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.gigById(resolvedGigId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
    setActionLoading(false);
    onStatusChange?.();
  }

  async function handleReject() {
    const req = requests.find((r) => r.status === "pending") || requests[0];
    if (!req) return;
    setActionLoading(true);
    const { error } = await rejectGigRequest(req.id);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.gigAlertDetail(resolvedGigId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.gigById(resolvedGigId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
      onStatusChange?.();
      onClose();
    }
    setActionLoading(false);
  }

  async function handleComplete() {
    setActionLoading(true);
    setActionError(null);
    const { error } = await completeGig(gig.id);
    if (error) {
      setActionError(error.message || "Failed to complete");
      setActionLoading(false);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.gigAlertDetail(resolvedGigId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.gigById(resolvedGigId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
    setActionLoading(false);
    onStatusChange?.();
  }

  function handleViewProfile(userId) {
    if (!resolvedGigId) {
      navigate(`/profile/${userId}`);
      return;
    }
    navigate(`/profile/${userId}`, {
      state: { returnTo: `/gigdetails/${resolvedGigId}` },
    });
  }

  const containerClass = asPage
    ? "gig-detail-surface gig-detail-surface--page"
    : "gig-detail-surface gig-detail-surface--modal alert-detail-surface";

  if (resolvedGigId && detailPending) {
    return <AlertGigDetailSkeleton onClose={onClose} asPage={asPage} />;
  }

  if (!resolvedGigId || !gig) {
    return (
      <div className={containerClass}>
        <div className="page fadein">
          <div className="topbar">
            <button className="btn bg-btn bico" onClick={onClose}><span style={{ fontSize: 15 }}>←</span></button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Gig Details</span>
            <div style={{ width: 34 }} />
          </div>
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--fg3)", fontFamily: "var(--mono)" }}>This gig is no longer available.</div>
          </div>
        </div>
      </div>
    );
  }

  const poster = gig.poster || {};
  const taker = gig.taker || null;
  const pendingReq = requests.find((r) => r.status === "pending");
  const acceptedReq = requests.find((r) => r.status === "accepted");
  const requesterUser = taker || pendingReq?.requester || acceptedReq?.requester || null;

  const expired = gig.expires_at && new Date(gig.expires_at) < new Date();
  const isActive = gig.status === "active";
  const isCompleted = gig.status === "completed";
  const isPending = gig.status === "requested" || gig.status === "open";
  const hasPendingRequest = !!pendingReq;
  const showContactInfo = isActive || isCompleted;

  const cd = gig.expires_at ? countdown(new Date(gig.expires_at).getTime()) : null;

  let effectiveStatus = gig.status;
  if (hasPendingRequest && gig.status === "open") effectiveStatus = "requested";

  return (
    <div className={containerClass}>
      <div className="page fadein">
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={onClose}><span style={{ fontSize: 15 }}>←</span></button>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Gig Details</span>
          <div style={{ width: 34 }} />
        </div>

        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)",
                background: "var(--bg3)", border: "1px solid var(--bd)", borderRadius: 4,
                padding: "2px 8px", color: "var(--fg3)",
              }}>{gig.category?.label || "Gig"}</span>
              <StatusBadge status={effectiveStatus} expired={expired} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)", lineHeight: 1.4, marginBottom: 6 }}>
              {gig.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--mono)", letterSpacing: "-.04em" }}>
                ${Number(gig.price).toFixed(2)}
              </div>
              {role === "poster" && hasPendingRequest && !isActive && !isCompleted && (
                <button
                  className="btn bgreen bsm"
                  onClick={handleAccept}
                  disabled={actionLoading}
                  style={{ fontSize: 12, padding: "6px 14px", gap: 5, opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? <Loader size={13} className="spin" /> : <CheckCircle size={13} />}
                  {actionLoading ? "Accepting…" : "Accept"}
                </button>
              )}
              {isActive && !expired && (
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
                  color: "var(--green-d)", display: "flex", alignItems: "center", gap: 4,
                }}>
                  <CheckCircle size={13} /> Active
                </span>
              )}
              {isCompleted && (
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
                  color: "var(--green-d)", display: "flex", alignItems: "center", gap: 4,
                }}>
                  🏅 Done
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {gig.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r)", background: "var(--bg3)",
                  border: "1px solid var(--bd)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: "var(--fg3)",
                }}><MapPin size={14} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>Location</div>
                  <div style={{ fontSize: 14, color: "var(--fg)" }}>{gig.location}</div>
                </div>
              </div>
            )}

            {cd && (
              <div key={tick} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r)", background: "var(--bg3)",
                  border: "1px solid var(--bd)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: cd.expired ? "var(--err)" : "var(--fg3)",
                }}><Timer size={14} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>
                    {cd.expired ? "Time ended" : "Time remaining"}
                  </div>
                  <div style={{
                    fontSize: 14, fontFamily: "var(--mono)", fontWeight: 600,
                    color: cd.expired ? "var(--err)" : "var(--amber)",
                  }}>
                    {cd.expired ? "Deadline passed" : `⏱ ${cd.text}`}
                  </div>
                </div>
              </div>
            )}

            {gig.description && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r)", background: "var(--bg3)",
                  border: "1px solid var(--bd)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: "var(--fg3)",
                }}><FileText size={14} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>Gig description</div>
                  <div style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.5 }}>{gig.description}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 8 }}>
              People
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <UserCard
                user={poster}
                label="Posted"
                onClick={() => handleViewProfile(poster.id)}
              />
              {requesterUser && (
                <UserCard
                  user={requesterUser}
                  label={isCompleted ? "Completed" : isActive ? "Taking" : "Requested"}
                  onClick={() => handleViewProfile(requesterUser.id)}
                />
              )}
            </div>
            {!requesterUser && isPending && !hasPendingRequest && (
              <div style={{
                marginTop: 8, padding: "10px 12px", borderRadius: "var(--r)",
                background: "var(--bg3)", border: "1px solid var(--bd)",
                fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)", textAlign: "center",
              }}>
                No one has requested this gig yet.
              </div>
            )}
          </div>

          {showContactInfo && (
            <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                Get in Touch
              </div>

              {role === "requester" && poster && <ContactSection user={poster} label={`${poster.first_name || "Poster"}`} />}
              {role === "poster" && requesterUser && <ContactSection user={requesterUser} label={`${requesterUser.first_name || "Taker"}`} />}
              {role === "requester" && requesterUser && <ContactSection user={requesterUser} label="Your info (shared)" />}
              {role === "poster" && poster && <ContactSection user={poster} label="Your info (shared)" />}
            </div>
          )}

          {isPending && (
            <div style={{ padding: "0 20px 16px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--amber-bg)", border: "1px solid var(--amber-bd)",
                borderRadius: "var(--r)", padding: "10px 12px",
                fontSize: 12, color: "var(--amber)",
              }}>
                <Lock size={13} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--mono)" }}>Contact info is shared only after the poster accepts.</span>
              </div>
            </div>
          )}

          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            {role === "poster" && hasPendingRequest && !isActive && !isCompleted && (
              <>
                <button
                  className="btn bgreen bfull blg"
                  onClick={handleAccept}
                  disabled={actionLoading}
                  style={{ opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
                  {actionLoading ? "Accepting…" : "Accept Request"}
                </button>
                <button
                  className="btn bo bfull"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  Decline
                </button>
              </>
            )}

            {role === "requester" && isPending && hasPendingRequest && !isActive && !isCompleted && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px", borderRadius: "var(--r)",
                background: "var(--amber-bg)", border: "1px solid var(--amber-bd)",
                fontSize: 13, fontWeight: 500, color: "var(--amber)", fontFamily: "var(--mono)",
              }}>
                <Clock size={14} />
                Waiting for approval…
              </div>
            )}

            {role === "poster" && isActive && !expired && (
              <button
                className="btn bp bfull blg"
                onClick={handleComplete}
                disabled={actionLoading}
                style={{ opacity: actionLoading ? 0.6 : 1 }}
              >
                {actionLoading ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
                {actionLoading ? "Completing…" : "Mark as Done"}
              </button>
            )}

            {role === "poster" && isActive && expired && (
              <button
                className="btn bp bfull blg"
                onClick={handleComplete}
                disabled={actionLoading}
                style={{ opacity: actionLoading ? 0.6 : 1 }}
              >
                {actionLoading ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
                Mark as Done Anyway
              </button>
            )}

            {role === "requester" && isActive && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px", borderRadius: "var(--r)",
                background: "var(--green-bg)", border: "1px solid var(--green-bd)",
                fontSize: 13, fontWeight: 500, color: "var(--green-d)", fontFamily: "var(--mono)",
              }}>
                <CheckCircle size={14} />
                Active · Waiting for poster to mark done
              </div>
            )}

            {isCompleted && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px", borderRadius: "var(--r)",
                background: "var(--green-bg)", border: "1px solid var(--green-bd)",
                fontSize: 13, fontWeight: 600, color: "var(--green-d)", fontFamily: "var(--mono)",
              }}>
                <span style={{ fontSize: 16 }}>🏅</span>
                Completed
              </div>
            )}

            {isCompleted && taker && poster && currentUserId && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentUserId === poster.id && (
                  <button
                    type="button"
                    className="btn bp bfull"
                    onClick={() => navigate(`/profile/${taker.id}?reviews=1`)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Star size={15} strokeWidth={2} />
                    Review {`${taker.first_name || "them"}`.trim()}
                  </button>
                )}
                {currentUserId === taker.id && (
                  <button
                    type="button"
                    className="btn bp bfull"
                    onClick={() => navigate(`/profile/${poster.id}?reviews=1`)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Star size={15} strokeWidth={2} />
                    Review {`${poster.first_name || "them"}`.trim()}
                  </button>
                )}
              </div>
            )}

            {actionError && (
              <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", textAlign: "center" }}>
                {actionError}
              </div>
            )}

            <button className="btn bo bfull" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
