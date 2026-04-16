import { useState, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, uploadAvatar, getAvatarUrl } from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";
import ContactFields, { normalizeContactFavoriteKeys } from "../components/ContactFields";
import { nanpDigitsFromInput, phoneFromStored } from "../utils/phoneNanp";

const EMPTY = {
  phone: "",
  venmo: "",
  cashapp: "",
  paypal: "",
  snapchat: "",
  instagram: "",
  discord: "",
  zelle: "",
  apple_pay: "",
  google_pay: "",
  contact_favorite_keys: [],
};

function trimOrNull(s) {
  const t = s != null ? String(s).trim() : "";
  return t === "" ? null : t;
}

const EDIT_PROFILE_RETURN_PATHS = new Set(["/profile", "/settings"]);

function resolveEditProfileReturnTo(state) {
  const r = state?.returnTo;
  if (typeof r === "string" && EDIT_PROFILE_RETURN_PATHS.has(r)) return r;
  return "/profile";
}

function profileRowToForm(p) {
  return {
    ...EMPTY,
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
  const fileInputRef = useRef(null);
  const hydratedRef = useRef(!!queryClient.getQueryData(queryKeys.myProfile)?.profile);

  const [profile, setProfile] = useState(() => {
    const p = queryClient.getQueryData(queryKeys.myProfile)?.profile;
    return p ? profileRowToForm(p) : EMPTY;
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

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  const handleSave = async () => {
    setError("");

    const phoneDigits = nanpDigitsFromInput(profile.phone);
    if (!phoneDigits) {
      setError("Phone number is required.");
      return;
    }
    const nationalLen = phoneDigits[0] === "1" ? phoneDigits.length - 1 : phoneDigits.length;
    if (nationalLen !== 10) {
      setError("Enter a valid 10-digit US phone number.");
      return;
    }

    setSaving(true);

    try {
      if (avatarFile) {
        const { error: avatarError } = await uploadAvatar(avatarFile);
        if (avatarError) {
          setError(`Photo upload failed: ${avatarError.message}`);
          setSaving(false);
          return;
        }
      }

      const { error: updateError } = await updateMyProfile({
        phone: profile.phone.trim(),
        venmo: trimOrNull(profile.venmo),
        cashapp: trimOrNull(profile.cashapp),
        paypal: trimOrNull(profile.paypal),
        snapchat: trimOrNull(profile.snapchat),
        instagram: trimOrNull(profile.instagram),
        discord: trimOrNull(profile.discord),
        zelle: trimOrNull(profile.zelle),
        apple_pay: trimOrNull(profile.apple_pay),
        google_pay: trimOrNull(profile.google_pay),
        contact_favorite_keys: normalizeContactFavoriteKeys(profile.contact_favorite_keys),
      });

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--bd)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: avatarColor,
                  color: "white",
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--bd)",
                }}
              >
                {initials}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--bg)",
              }}
            >
              <Camera size={13} />
            </div>
          </div>
          <button className="btn bg-btn bsm" onClick={() => fileInputRef.current?.click()}>
            {displayUrl ? "Change photo" : "Add photo"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
        </div>

        <ContactFields
          profile={profile}
          onFieldChange={onFieldChange}
          emailDisplay={emailDisplay}
          phoneMode="formatted"
          phoneRequired
          favoriteKeys={profile.contact_favorite_keys || []}
          onFavoriteToggle={onFavoriteToggle}
        />

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--r)",
              padding: "10px 12px",
              fontSize: 13,
              color: "#dc2626",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

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
