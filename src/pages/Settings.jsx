import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, Mail, Shield, Smartphone, Info, ChevronRight, Loader, Trash2, AlertTriangle, X } from "lucide-react";
import { getMyProfile, updateMyProfile, getMyDeletionRequest, requestAccountDeletion } from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";
import SettingsRowToggle from "../components/SettingsRowToggle";

const DELETE_CONFIRM_PHRASE = "DELETE";

const APP_VERSION = "1.0.0";

const STORAGE = {
  notifyGigUpdates: "cg_settings_notify_gig_updates",
  notifyAlerts: "cg_settings_notify_alerts",
};

function readBool(key, defaultVal) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    return v === "1";
  } catch {
    return defaultVal;
  }
}

function writeBool(key, val) {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export default function Settings() {
  const navigate = useNavigate();
  const { data: profileData, isPending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });
  const profile = profileData?.profile || null;
  const email = profile?.email || "";

  const { data: deletionData } = useQuery({
    queryKey: queryKeys.accountDeletion,
    queryFn: getMyDeletionRequest,
    enabled: !!profile,
    staleTime: 60_000,
    retry: false,
  });
  const deletionReq = deletionData?.request;
  const isPendingDeletion =
    deletionReq?.status === "pending" &&
    deletionReq?.grace_ends_at &&
    new Date(deletionReq.grace_ends_at).getTime() > Date.now();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteConfirmInput("");
    setDeleteError("");
  }, []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
  }, [profile?.id, profile?.first_name, profile?.last_name]);

  const [notifyGigUpdates, setNotifyGigUpdates] = useState(() =>
    readBool(STORAGE.notifyGigUpdates, true)
  );
  const [notifyAlerts, setNotifyAlerts] = useState(() =>
    readBool(STORAGE.notifyAlerts, true)
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailAlertsSaving, setEmailAlertsSaving] = useState(false);

  useEffect(() => {
    if (profile && profile.email_alerts_enabled !== undefined && profile.email_alerts_enabled !== null) {
      setEmailAlerts(!!profile.email_alerts_enabled);
    }
  }, [profile?.id, profile?.email_alerts_enabled]);

  useEffect(() => {
    writeBool(STORAGE.notifyGigUpdates, notifyGigUpdates);
  }, [notifyGigUpdates]);

  useEffect(() => {
    writeBool(STORAGE.notifyAlerts, notifyAlerts);
  }, [notifyAlerts]);

  async function handleEmailAlertsChange(next) {
    const prev = emailAlerts;
    setEmailAlerts(next);
    setEmailAlertsSaving(true);
    const { error } = await updateMyProfile({ email_alerts_enabled: next });
    setEmailAlertsSaving(false);
    if (error) {
      setEmailAlerts(prev);
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
  }

  async function handleSaveName() {
    setNameError("");
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setNameError("First and last name are required.");
      return;
    }
    setNameSaving(true);
    const { error } = await updateMyProfile({ first_name: fn, last_name: ln });
    setNameSaving(false);
    if (error) {
      setNameError(error.message || "Couldn't save your name.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
  }

  function deleteConfirmMatches() {
    return deleteConfirmInput.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
  }

  async function handleConfirmDeleteAccount() {
    if (!deleteConfirmMatches()) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    const { error } = await requestAccountDeletion();
    setDeleteSubmitting(false);
    if (error) {
      setDeleteError(error.message || "Couldn't schedule deletion. Try again or email support@getcampusgig.com.");
      return;
    }
    closeDeleteModal();
    queryClient.invalidateQueries({ queryKey: queryKeys.accountDeletion });
  }

  const graceEndsLabel = deletionReq?.grace_ends_at
    ? new Date(deletionReq.grace_ends_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <button
          type="button"
          className="btn bg-btn bico"
          onClick={() => navigate("/profile")}
          aria-label="Back to profile"
          style={{ marginBottom: 10 }}
        >
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
          Settings
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          Account, alerts, and how CampusGig behaves on this device.
        </div>
      </div>

      <div className="scroll scroll--settings-pad scroll--fine-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
            padding: "12px 0 6px",
          }}
        >
          Account
        </div>
        <div
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", wordBreak: "break-all" }}>
            {isPending ? "…" : email || "—"}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            padding: "14px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 10 }}>Your name</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="lbl">First name</label>
              <input
                className="inp"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                disabled={isPending || !profile}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="lbl">Last name</label>
              <input
                className="inp"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                disabled={isPending || !profile}
              />
            </div>
          </div>
          {nameError ? (
            <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 10 }}>
              {nameError}
            </div>
          ) : null}
          <button
            type="button"
            className="btn bp bfull"
            style={{ marginTop: 12, opacity: nameSaving ? 0.75 : 1 }}
            onClick={handleSaveName}
            disabled={nameSaving || isPending || !profile}
          >
            {nameSaving ? <Loader size={16} className="spin" /> : "Save name"}
          </button>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => navigate("/profile/edit", { state: { returnTo: "/settings" } })}
          style={{
            width: "100%",
            justifyContent: "space-between",
            padding: "14px 14px",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            background: "var(--bg)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--fg)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Smartphone size={18} color="var(--fg3)" />
            Edit contacts &amp; payment methods
          </span>
          <ChevronRight size={18} color="var(--fg4)" />
        </button>

        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
            padding: "16px 0 6px",
          }}
        >
          Alerts
        </div>
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            padding: "0 14px",
          }}
        >
          <SettingsRowToggle
            icon={Bell}
            label="Gig & request alerts"
            hint="In-app alerts when someone requests, accepts, declines, or completes a gig you're involved in."
            checked={notifyGigUpdates}
            onChange={setNotifyGigUpdates}
          />
          <SettingsRowToggle
            icon={BellRing}
            label="New in Alerts tab"
            hint="Banner when you have new items in Alerts (this device)."
            checked={notifyAlerts}
            onChange={setNotifyAlerts}
          />
          <SettingsRowToggle
            icon={Mail}
            label="Email alerts"
            hint="Transactional emails to your @nmsu.edu for important gig alerts and reviews (account-wide). Turn off anytime."
            checked={emailAlerts}
            onChange={handleEmailAlertsChange}
            isLast
          />
        </div>
        {emailAlertsSaving ? (
          <p style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", lineHeight: 1.45, margin: "0 0 0 0" }}>
            Saving email preference…
          </p>
        ) : (
          <p style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", lineHeight: 1.45, margin: 0 }}>
            In-app toggles above apply on this browser only. Email alerts use your account setting and school email.
          </p>
        )}

        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
            padding: "16px 0 6px",
          }}
        >
          Legal
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => navigate("/terms")}
          style={{
            width: "100%",
            justifyContent: "space-between",
            padding: "12px 14px",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            background: "var(--bg)",
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={17} color="var(--fg3)" />
            Terms of service
          </span>
          <ChevronRight size={18} color="var(--fg4)" />
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => navigate("/privacy")}
          style={{
            width: "100%",
            justifyContent: "space-between",
            padding: "12px 14px",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            background: "var(--bg)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={17} color="var(--fg3)" />
            Privacy policy
          </span>
          <ChevronRight size={18} color="var(--fg4)" />
        </button>

        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
            padding: "20px 0 6px",
          }}
        >
          Danger zone
        </div>

        {isPendingDeletion ? (
          <div
            style={{
              background: "var(--err-bg)",
              border: "1px solid #fecaca",
              borderRadius: "var(--r)",
              padding: "14px 14px",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={18} color="#b91c1c" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>
                  Account deletion scheduled
                </div>
                <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.5 }}>
                  Your data is set to be removed after{" "}
                  <strong style={{ fontFamily: "var(--mono)" }}>{graceEndsLabel}</strong> (about 15 days from when you
                  requested). <strong>To cancel:</strong> This will sign you out. After you sign in again with your{" "}
                  <strong>@nmsu.edu</strong> magic link, a fresh sign-in clears this schedule automatically. If you delete
                  again later, you'll go through the full delete flow from scratch.
                  Stuck? Email <strong>support@getcampusgig.com</strong>.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn"
          onClick={() => {
            if (isPendingDeletion) return;
            setDeleteModalOpen(true);
          }}
          disabled={isPendingDeletion}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 16px",
            border: "2px solid #dc2626",
            borderRadius: "var(--r)",
            background: "#fef2f2",
            fontSize: 14,
            fontWeight: 700,
            color: "#b91c1c",
            cursor: isPendingDeletion ? "not-allowed" : "pointer",
            opacity: isPendingDeletion ? 0.55 : 1,
            gap: 8,
          }}
        >
          <Trash2 size={18} strokeWidth={2.25} />
          Delete account
        </button>

        <div
          style={{
            marginTop: 20,
            padding: "14px 0",
            textAlign: "center",
            fontSize: 11,
            color: "var(--fg4)",
            fontFamily: "var(--mono)",
          }}
        >
          GetCampusGig · v{APP_VERSION}
        </div>
      </div>

      {deleteModalOpen && (
        <div className="modal-center-root" onClick={closeDeleteModal}>
          <div className="modal-center-backdrop" aria-hidden />
          <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-center-hd">
              <div className="modal-center-hd-title">
                <Trash2 size={15} color="#b91c1c" aria-hidden />
                <span style={{ color: "#991b1b" }}>Delete your account</span>
              </div>
              <button type="button" className="modal-center-close" onClick={closeDeleteModal} aria-label="Close">
                <X size={13} />
              </button>
            </div>

            <div style={{ padding: "0 20px 8px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.45, flexShrink: 0 }}>
              This cannot be undone after the grace period.
            </div>

            <div className="modal-center-body" style={{ padding: "8px 20px 12px", fontSize: 13, color: "var(--fg2)", lineHeight: 1.55 }}>
              <p style={{ margin: "0 0 10px" }}>
                <strong>What gets removed:</strong> Profile, rep, reviews, gigs, alerts, and activity — everything tied
                to your account on GetCampusGig.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong>Scheduling, not instant:</strong> Tapping the button below schedules deletion. Your account stays
                usable until after the 15-day grace period.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong>How to cancel:</strong> This will sign you out. After you sign in again with your @nmsu.edu magic
                link, a fresh sign-in clears the scheduled deletion.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Graduated / lost email:</strong> If you can no longer receive a magic link at @nmsu.edu, we cannot
                verify ownership — treat deletion as final.
              </p>
            </div>

            <div className="modal-center-ft" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="lbl" style={{ fontSize: 11 }}>
                  Type <strong style={{ color: "#b91c1c" }}>{DELETE_CONFIRM_PHRASE}</strong> to confirm
                </label>
                <input
                  className="inp"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={DELETE_CONFIRM_PHRASE}
                  autoComplete="off"
                  autoCapitalize="characters"
                  style={{ marginTop: 6, borderRadius: 10 }}
                />
                {deleteError ? (
                  <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 6 }}>
                    {deleteError}
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn bo bfull"
                  onClick={closeDeleteModal}
                  style={{ flex: 1, minHeight: 44, fontSize: 14, fontWeight: 600, borderRadius: 12 }}
                >
                  Keep account
                </button>
                <button
                  type="button"
                  className="btn bfull"
                  disabled={!deleteConfirmMatches() || deleteSubmitting}
                  onClick={handleConfirmDeleteAccount}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 12,
                    border: deleteConfirmMatches() && !deleteSubmitting ? "1px solid #b91c1c" : "1px solid var(--bd)",
                    background: deleteConfirmMatches() && !deleteSubmitting ? "#dc2626" : "var(--bg3)",
                    color: deleteConfirmMatches() && !deleteSubmitting ? "#fff" : "var(--fg4)",
                    cursor: !deleteConfirmMatches() || deleteSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleteSubmitting ? <Loader size={15} className="spin" /> : <Trash2 size={15} strokeWidth={2.25} />}
                  {deleteSubmitting ? "…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
