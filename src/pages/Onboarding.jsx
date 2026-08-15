import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { Camera } from "lucide-react";
import { createProfile, uploadAvatar } from "../lib/profile";
import { supabase } from "../lib/supabase";
import ProfileContactForm from "../components/ProfileContactForm";
import { EMPTY_CONTACT_PROFILE, validateNanpPhone, profileContactsToApi, mapContactError } from "../utils/profileForm";

export default function Onboarding({ onComplete }) {
  const [profile, setProfile] = useState(EMPTY_CONTACT_PROFILE);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmailDisplay(user.email);
    })();
  }, []);

  function onFieldChange(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function handleAvatarSelect(file) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const handleFinish = async (phoneRequiredMessage) => {
    setError("");

    const phoneCheck = validateNanpPhone(profile.phone, {
      requiredMessage: phoneRequiredMessage,
    });
    if (!phoneCheck.ok) {
      setError(phoneCheck.error);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign up again.");
        setLoading(false);
        return;
      }

      const { error: createError } = await createProfile({
        phone: profile.phone.trim(),
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
        email: user.email,
        ...profileContactsToApi(profile),
      });

      if (createError) {
        setError(mapContactError(createError));
        setLoading(false);
        return;
      }

      if (avatarFile) {
        const { error: avatarError } = await uploadAvatar(avatarFile);
        if (avatarError) {
          console.warn("Avatar upload failed:", avatarError.message);
        }
      }

      onComplete();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fadein">
      <div style={{ padding: "52px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
          Set up your profile
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          Phone is required. Fill popular payment methods first — everything else is optional.
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ProfileContactForm
          profile={profile}
          onFieldChange={onFieldChange}
          emailDisplay={emailDisplay}
          error={error}
          onError={setError}
          avatarDisplayUrl={avatarPreview}
          avatarFallback={{ placeholder: <Camera size={24} color="var(--fg4)" /> }}
          onAvatarSelect={handleAvatarSelect}
          phoneRequired
        />

        <button
          className="btn bp bfull blg"
          style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
          onClick={() => handleFinish()}
          disabled={loading}
        >
          {loading ? <Loader size={16} className="spin" /> : "Finish setup"}
        </button>
        <button
          className="btn bg-btn bfull"
          onClick={() => handleFinish("Phone number is required — enter a valid 10-digit US number.")}
          disabled={loading}
        >
          Skip optional fields
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
