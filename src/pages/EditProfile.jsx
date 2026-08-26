import { useState, useLayoutEffect, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UnsavedChangesModal from "../components/modals/UnsavedChangesModal";
import { Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, uploadAvatar, getAvatarUrl } from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";
import { normalizeContactFavoriteKeys } from "../components/ContactFields";
import ProfileContactForm, { FormErrorBanner } from "../components/ProfileContactForm";
import { phoneFromStored } from "../utils/phoneNanp";
import { EMPTY_CONTACT_PROFILE, validateNanpPhone, validateRequiredPayment, profileContactsToApi, mapContactError } from "../utils/profileForm";
import ProfileTabBar from "../features/profile/components/ProfileTabBar";
import EditProfileIdentity from "../features/profile/components/EditProfileIdentity";

const EDIT_PROFILE_RETURN_PATHS = new Set(["/profile", "/settings"]);
const EDIT_TABS = [
  ["profile", "Profile"],
  ["contacts", "Contacts"],
];
const EDIT_TAB_STORAGE_KEY = "cg:editProfile:tab";
const EDIT_TAB_IDS = new Set(["profile", "contacts"]);

function persistEditTab(tab) {
  if (!EDIT_TAB_IDS.has(tab)) return;
  try {
    localStorage.setItem(EDIT_TAB_STORAGE_KEY, tab);
  } catch {
    /* ignore quota / private mode */
  }
}

function readStoredEditTab() {
  try {
    const saved = localStorage.getItem(EDIT_TAB_STORAGE_KEY);
    if (EDIT_TAB_IDS.has(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "profile";
}

function resolveEditProfileReturnTo(state) {
  const r = state?.returnTo;
  if (typeof r === "string" && EDIT_PROFILE_RETURN_PATHS.has(r)) return r;
  return "/profile";
}

function resolveEditTab(state) {
  if (state?.tab === "contacts" || state?.tab === "profile") {
    persistEditTab(state.tab);
    return state.tab;
  }
  return readStoredEditTab();
}

function formSnapshot(firstName, lastName, profile, hasAvatarFile) {
  return JSON.stringify({
    firstName: String(firstName || "").trim(),
    lastName: String(lastName || "").trim(),
    profile,
    hasAvatarFile: Boolean(hasAvatarFile),
  });
}

function profileRowToForm(p) {
  return {
    ...EMPTY_CONTACT_PROFILE,
    venmo: p.venmo || "",
    cashapp: p.cashapp || "",
    paypal: p.paypal || "",
    snapchat: p.snapchat || "",
    instagram: p.instagram || "",
    discord: p.discord || "",
    zelle: p.zelle || "",
    apple_pay: p.apple_pay || "",
    google_pay: p.google_pay || "",
    phone: phoneFromStored(p.phone),
    contact_favorite_keys: normalizeContactFavoriteKeys(p.contact_favorite_keys),
    accepts_cash: Boolean(p.accepts_cash),
  };
}

function SaveChangesButton({ saving, onClick, compact }) {
  return (
    <button
      type="button"
      className={compact ? "btn bp bsm" : "btn bp bfull blg"}
      style={{ opacity: saving ? 0.7 : 1 }}
      onClick={onClick}
      disabled={saving}
    >
      {saving ? <Loader size={16} className="spin" /> : "Save"}
    </button>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveEditProfileReturnTo(location.state);
  const hydratedRef = useRef(!!queryClient.getQueryData(queryKeys.myProfile)?.profile);

  const [tab, setTab] = useState(() => resolveEditTab(location.state));
  const [profile, setProfile] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p ? profileRowToForm(p) : { ...EMPTY_CONTACT_PROFILE, contact_favorite_keys: [] };
  });
  const [firstName, setFirstName] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p?.first_name || "";
  });
  const [lastName, setLastName] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p?.last_name || "";
  });
  const [emailDisplay, setEmailDisplay] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p?.email || "";
  });
  const [repScore, setRepScore] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p?.rep_score || 0;
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    if (!p?.avatar_url) return null;
    return getAvatarUrl(p.avatar_url) || null;
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [initials, setInitials] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return `${p?.first_name?.charAt(0) || ""}${p?.last_name?.charAt(0) || ""}`.toUpperCase();
  });
  const [avatarColor, setAvatarColor] = useState(
    () => queryClient.getQueryData(queryKeys.myProfile)?.profile?.avatar_color || "#6366f1"
  );
  const [error, setError] = useState("");
  const [formReady, setFormReady] = useState(() => !!queryClient.getQueryData(queryKeys.myProfile)?.profile);
  const [saving, setSaving] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const dirtyRef = useRef(false);
  const baselineRef = useRef((() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    if (!p) return null;
    return formSnapshot(p.first_name || "", p.last_name || "", profileRowToForm(p), false);
  })());

  const { data: profileData, isPending: queryPending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  useLayoutEffect(() => {
    const p = profileData?.profile;
    if (!p || hydratedRef.current) return;
    hydratedRef.current = true;
    setProfile(profileRowToForm(p));
    setFirstName(p.first_name || "");
    setLastName(p.last_name || "");
    setEmailDisplay(p.email || "");
    setRepScore(p.rep_score || 0);
    setInitials(`${p.first_name?.charAt(0) || ""}${p.last_name?.charAt(0) || ""}`.toUpperCase());
    setAvatarColor(p.avatar_color || "#6366f1");
    if (p.avatar_url) {
      const url = getAvatarUrl(p.avatar_url);
      setAvatarUrl(url || null);
    } else {
      setAvatarUrl(null);
    }
    setFormReady(true);
    baselineRef.current = formSnapshot(p.first_name || "", p.last_name || "", profileRowToForm(p), false);
  }, [profileData]);

  function onFieldChange(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function onFavoriteToggle(key) {
    setProfile((p) => {
      const arr = [...(p.contact_favorite_keys || [])];
      const i = arr.indexOf(key);
      if (i >= 0) {
        return { ...p, contact_favorite_keys: arr.filter((k) => k !== key) };
      }
      return { ...p, contact_favorite_keys: [key, ...arr.filter((k) => k !== key)] };
    });
  }

  function handleAvatarSelect(file) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function selectTab(next) {
    setTab(next);
    persistEditTab(next);
  }

  const isDirty = useMemo(() => {
    if (baselineRef.current == null) return false;
    return formSnapshot(firstName, lastName, profile, avatarFile) !== baselineRef.current;
  }, [firstName, lastName, profile, avatarFile]);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  function requestLeave(to, options) {
    if (!dirtyRef.current) {
      navigate(to, options);
      return;
    }
    setLeaveTarget({ to, options });
  }

  function stayOnPage() {
    setLeaveTarget(null);
  }

  function leaveWithoutSaving() {
    const dest = leaveTarget;
    setLeaveTarget(null);
    dirtyRef.current = false;
    if (dest?.to) navigate(dest.to, dest.options);
    else navigate(returnTo);
  }

  const handleSave = async () => {
    setError("");

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError("First and last name are required.");
      setTab("profile");
      persistEditTab("profile");
      return;
    }

    const phoneCheck = validateNanpPhone(profile.phone);
    if (!phoneCheck.ok) {
      setError(phoneCheck.error);
      setTab("contacts");
      persistEditTab("contacts");
      return;
    }

    const payCheck = validateRequiredPayment(profile);
    if (!payCheck.ok) {
      setError(payCheck.error);
      setTab("contacts");
      persistEditTab("contacts");
      return;
    }

    setSaving(true);

    try {
      let photoError = null;
      if (avatarFile) {
        const { error: avatarError } = await uploadAvatar(avatarFile);
        if (avatarError) photoError = avatarError;
      }

      const { error: updateError } = await updateMyProfile({
        first_name: fn,
        last_name: ln,
        phone: profile.phone.trim(),
        ...profileContactsToApi(profile),
        contact_favorite_keys: normalizeContactFavoriteKeys(profile.contact_favorite_keys),
      });

      if (updateError) {
        setError(mapContactError(updateError));
        setSaving(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });

      if (photoError) {
        setError(`Photo upload failed: ${photoError.message}`);
        setSaving(false);
        return;
      }

      dirtyRef.current = false;
      navigate(returnTo);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (queryPending || !formReady) {
    return (
      <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader size={20} className="spin" color="var(--fg3)" />
      </div>
    );
  }

  const displayUrl = avatarPreview || avatarUrl;
  const liveInitials = `${firstName.trim().charAt(0) || ""}${lastName.trim().charAt(0) || ""}`.toUpperCase() || initials;

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button
            type="button"
            className="btn bg-btn bico"
            onClick={() => requestLeave(returnTo)}
            aria-label={returnTo === "/settings" ? "Back to settings" : "Back to profile"}
          >
            <span style={{ fontSize: 15 }}>←</span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.03em" }}>Edit profile</div>
          </div>
          <SaveChangesButton saving={saving} onClick={handleSave} compact />
        </div>
        <ProfileTabBar
          pTab={tab}
          setPTab={selectTab}
          tabs={EDIT_TABS}
          ariaLabel="Edit profile section"
        />
      </div>

      <div className="scroll" style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {tab === "profile" ? (
          <>
            <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.45 }}>
              Photo, name, cosmetics, and email — this is how you show up.
            </div>
            <EditProfileIdentity
              onAvatarSelect={handleAvatarSelect}
              onError={setError}
              avatarDisplayUrl={displayUrl}
              avatarFallback={{ initials: liveInitials, color: avatarColor }}
              firstName={firstName}
              lastName={lastName}
              onFirstName={setFirstName}
              onLastName={setLastName}
              emailDisplay={emailDisplay}
              repScore={repScore}
              onOpenInventory={() =>
                requestLeave("/inventory", { state: { returnTo: "/profile/edit" } })
              }
            />
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.45 }}>
              Phone plus one way to get paid — a handle, or cash for now if you don&apos;t remember it.
            </div>
            <ProfileContactForm
              profile={profile}
              onFieldChange={onFieldChange}
              onFavoriteToggle={onFavoriteToggle}
              emailDisplay={emailDisplay}
              error=""
              onError={setError}
              phoneRequired
              showFavorites
              showAvatar={false}
              showEmail={false}
            />
          </>
        )}

        <FormErrorBanner error={error} />

        <SaveChangesButton saving={saving} onClick={handleSave} />
        <button className="btn bg-btn bfull" onClick={() => requestLeave(returnTo)} disabled={saving}>
          Cancel
        </button>
        <div style={{ height: 8 }} />
      </div>

      {leaveTarget ? (
        <UnsavedChangesModal onStay={stayOnPage} onLeave={leaveWithoutSaving} />
      ) : null}
    </div>
  );
}
