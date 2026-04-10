import { useState, useEffect } from "react";
import {
  Loader, MapPin, Timer, FileText, CheckCircle, XCircle, Clock,
  MessageCircle, Phone, AtSign, DollarSign, Smartphone, Lock,
} from "lucide-react";
import { getGigDetail, acceptGigRequest, rejectGigRequest, completeGig, getAvatarUrl } from "../../lib/profile";
import { getLevel, countdown } from "../../utils/helpers";
import LevelBadge from "../LevelBadge";
import Stars from "../Stars";

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
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase();
  const avatarUrl = user.avatar_url ? getAvatarUrl(user.avatar_url) : null;
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
      {avatarUrl ? (
        <img src={avatarUrl} alt="" style={{
          width: 44, height: 44, borderRadius: "50%", objectFit: "cover",
          border: "2px solid var(--bd)", margin: "0 auto 6px",
        }} />
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: user.avatar_color || "#6366f1",
          color: "white", fontSize: 15, fontWeight: 700, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: "2px solid var(--bd)", margin: "0 auto 6px",
        }}>{initials}</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <LevelBadge label={lvl.label} />
      </div>
      <div style={{ fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)", fontWeight: 600 }}>View Profile ›</div>
    </div>
  );
}

function ContactSection({ user, label }) {
  if (!user) return null;
  const name = `${user.first_name || ""} ${user.last_name?.charAt(0) || ""}.`.trim();
  const contacts = [
    user.snapchat && { icon: <Smartphone size={13} />, label: "Snapchat", val: user.snapchat },
    user.phone && { icon: <Phone size={13} />, label: "Phone", val: user.phone },
    user.venmo && { icon: <DollarSign size={13} />, label: "Venmo", val: user.venmo },
    user.cashapp && { icon: <DollarSign size={13} />, label: "CashApp", val: user.cashapp },
    user.paypal && { icon: <AtSign size={13} />, label: "PayPal", val: user.paypal },
  ].filter(Boolean);

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
          <div key={c.label} style={{
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

export default function AlertDetailModal({ notification, onClose, onStatusChange, setScreen }) {
  const [loading, setLoading] = useState(true);
  const [gig, setGig] = useState(null);
  const [requests, setRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const meta = notification?.metadata || {};
  const role = meta.role;

  useEffect(() => {
    if (meta.gig_id) loadDetail();
  }, []);

  async function loadDetail() {
    setLoading(true);
    const { gig: g, requests: r } = await getGigDetail(meta.gig_id);
    setGig(g);
    setRequests(r || []);
    setLoading(false);
  }

  async function handleAccept() {
    const req = requests.find((r) => r.status === "pending") || requests[0];
    if (!req) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await acceptGigRequest(req.id, gig.id, req.requester_id);
    if (error) {
      setActionError(error.message || "Failed to accept");
      setActionLoading(false);
      return;
    }
    await loadDetail();
    setActionLoading(false);
    onStatusChange?.();
  }

  async function handleReject() {
    const req = requests.find((r) => r.status === "pending") || requests[0];
    if (!req) return;
    setActionLoading(true);
    const { error } = await rejectGigRequest(req.id, gig.id, req.requester_id);
    if (!error) {
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
    await loadDetail();
    setActionLoading(false);
    onStatusChange?.();
  }

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 30, maxWidth: 393, margin: "0 auto", background: "var(--bg)" }}>
        <div className="page fadein">
          <div className="topbar">
            <button className="btn bg-btn bico" onClick={onClose}><span style={{ fontSize: 15 }}>←</span></button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Task Details</span>
            <div style={{ width: 34 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 300 }}>
            <Loader size={20} className="spin" color="var(--fg3)" />
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 30, maxWidth: 393, margin: "0 auto", background: "var(--bg)" }}>
        <div className="page fadein">
          <div className="topbar">
            <button className="btn bg-btn bico" onClick={onClose}><span style={{ fontSize: 15 }}>←</span></button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Task Details</span>
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
  const isPending = gig.status === "requested";
  const showContactInfo = isActive || isCompleted;

  const cd = gig.expires_at ? countdown(new Date(gig.expires_at).getTime()) : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, maxWidth: 393, margin: "0 auto", background: "var(--bg)" }}>
      <div className="page fadein">
        <div className="topbar">
          <button className="btn bg-btn bico" onClick={onClose}><span style={{ fontSize: 15 }}>←</span></button>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Task Details</span>
          <div style={{ width: 34 }} />
        </div>

        <div className="scroll" style={{ paddingBottom: 80 }}>
          {/* Gig header */}
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)",
                background: "var(--bg3)", border: "1px solid var(--bd)", borderRadius: 4,
                padding: "2px 8px", color: "var(--fg3)",
              }}>{gig.category?.label || "Gig"}</span>
              <StatusBadge status={gig.status} expired={expired} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)", lineHeight: 1.4, marginBottom: 6 }}>
              {gig.title}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--mono)", letterSpacing: "-.04em" }}>
              ${Number(gig.price).toFixed(2)}
            </div>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Location */}
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

            {/* Time */}
            {cd && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r)", background: "var(--bg3)",
                  border: "1px solid var(--bd)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: cd.expired ? "var(--err)" : "var(--fg3)",
                }}><Timer size={14} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>
                    {cd.expired ? "Time ended" : "Time remaining"}
                  </div>
                  <div style={{ fontSize: 14, color: cd.expired ? "var(--err)" : "var(--fg)", fontWeight: cd.expired ? 600 : 400 }}>
                    {cd.expired ? "Deadline passed" : cd.text}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {gig.description && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r)", background: "var(--bg3)",
                  border: "1px solid var(--bd)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, color: "var(--fg3)",
                }}><FileText size={14} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>Task description</div>
                  <div style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.5 }}>{gig.description}</div>
                </div>
              </div>
            )}
          </div>

          {/* People section */}
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 8 }}>
              People
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <UserCard
                user={poster}
                label="Posted"
                onClick={() => { onClose(); setScreen("userProfile", poster.id); }}
              />
              {requesterUser && (
                <UserCard
                  user={requesterUser}
                  label={isCompleted ? "Completed" : isActive ? "Taking" : "Requested"}
                  onClick={() => { onClose(); setScreen("userProfile", requesterUser.id); }}
                />
              )}
            </div>
          </div>

          {/* Contact info — shown when active or completed */}
          {showContactInfo && (
            <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                Get in Touch
              </div>

              {role === "requester" && poster && <ContactSection user={poster} label={`${poster.first_name || "Poster"}`} />}
              {role === "poster" && requesterUser && <ContactSection user={requesterUser} label={`${requesterUser.first_name || "Taker"}`} />}
              {role === "requester" && requesterUser && <ContactSection user={requesterUser} label="Your info (shared)" />}
              {role === "poster" && poster && <ContactSection user={poster} label="Your info (shared)" />}

              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "var(--bg3)", border: "1px solid var(--bd)",
                borderRadius: "var(--r)", padding: "10px 12px",
                fontSize: 12, color: "var(--fg2)", lineHeight: 1.5,
              }}>
                <MessageCircle size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--fg3)" }} />
                <span>
                  <strong>Add them on Snapchat</strong> or text them to coordinate pickup/delivery.
                  Payment and task completion happen off-app.
                </span>
              </div>
            </div>
          )}

          {/* Payment privacy notice — shown when pending */}
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

          {/* Actions */}
          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Poster sees accept/decline when pending */}
            {role === "poster" && isPending && pendingReq && (
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

            {/* Requester sees pending status */}
            {role === "requester" && isPending && (
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

            {/* Poster sees mark-as-done when active */}
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

            {/* Poster with expired active gig */}
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

            {/* Requester sees active status */}
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

            {/* Completed badge */}
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
