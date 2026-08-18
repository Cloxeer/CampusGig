import { useState, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, uploadAvatar, getAvatarUrl } from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";
import { normalizeContactFavoriteKeys } from "../components/ContactFields";
import ProfileContactForm from "../components/ProfileContactForm";
import { phoneFromStored } from "../utils/phoneNanp";
import { EMPTY_CONTACT_PROFILE, validateNanpPhone, profileContactsToApi, mapContactError } from "../utils/profileForm";

const EDIT_PROFILE_RETURN_PATHS = new Set(["/profile", "/settings"]);

function resolveEditProfileReturnTo(state) {
  const r = state?.returnTo;
  if (typeof r === "string" && EDIT_PROFILE_RETURN_PATHS.has(r)) return r;
  return "/profile";
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
  };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = resolveEditProfileReturnTo(location.state);
  const hydratedRef = useRef(!!queryClient.getQueryData(queryKeys.myProfile)?.profile);

  const [profile, setProfile] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p ? profileRowToForm(p) : { ...EMPTY_CONTACT_PROFILE, contact_favorite_keys: [] };
  });
  const [emailDisplay, setEmailDisplay] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p?.email || "";
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

  const { data: profileData, isPending: queryPending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  useLayoutEffect(() => {
    const p = profileData?.profile;
    if (!p || hydratedRef.current) return;
    hydratedRef.current = true;
    setProfile(profileRowToForm(p));
    setEmailDisplay(p.email || "");
    setInitials(`${p.first_name?.charAt(0) || ""}${p.last_name?.charAt(0) || ""}`.toUpperCase());
    setAvatarColor(p.avatar_color || "#6366f1");
    if (p.avatar_url) {
      const url = getAvatarUrl(p.avatar_url);
      setAvatarUrl(url || null);
    } else {
      setAvatarUrl(null);
    }
    setFormReady(true);
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

  const handleSave = async () => {
    setError("");

    const phoneCheck = validateNanpPhone(profile.phone);
    if (!phoneCheck.ok) {
      setError(phoneCheck.error);
      return;
    }

    setSaving(true);

    try {
      /* Try the photo, but a failure must NOT block the rest of the form —
         we capture the error and still save everything else below. */
      let photoError = null;
      if (avatarFile) {
        const { error: avatarError } = await uploadAvatar(avatarFile);
        if (avatarError) photoError = avatarError;
      }

      const { error: updateError } = await updateMyProfile({
        phone: profile.phone.trim(),
        ...profileContactsToApi(profile),
        contact_favorite_keys: normalizeContactFavoriteKeys(profile.contact_favorite_keys),
      });

      if (updateError) {
        setError(mapContactError(updateError));
        setSaving(false);
        return;
      }

      /* Phone + contacts are saved regardless of the photo. */
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });

      if (photoError) {
        /* Keep the user here with the photo error visible (and retryable)
           rather than navigating away. */
        setError(`Photo upload failed: ${photoError.message}`);
        setSaving(false);
        return;
      }

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

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <button
          type="button"
          className="btn bg-btn bico"
          onClick={() => navigate(returnTo)}
          aria-label={returnTo === "/settings" ? "Back to settings" : "Back to profile"}
          style={{ marginBottom: 10 }}
        >
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
          Edit profile
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          Phone is required. Popular payment methods first — everything else is optional.
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ProfileContactForm
          profile={profile}
          onFieldChange={onFieldChange}
          onFavoriteToggle={onFavoriteToggle}
          onAvatarSelect={handleAvatarSelect}
          emailDisplay={emailDisplay}
          error={error}
          onError={setError}
          avatarDisplayUrl={displayUrl}
          avatarFallback={{ initials, color: avatarColor }}
          phoneRequired
          showFavorites
        />

        <button
          className="btn bp bfull blg"
          style={{ marginTop: 4, opacity: saving ? 0.7 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader size={16} className="spin" /> : "Save changes"}
        </button>
        <button className="btn bg-btn bfull" onClick={() => navigate(returnTo)} disabled={saving}>
          Cancel
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
