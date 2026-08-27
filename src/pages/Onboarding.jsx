import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader, Camera } from "lucide-react";
import { createProfile, uploadAvatar } from "../lib/profile";
import { supabase } from "../lib/supabase";
import ProfileContactForm, { FormErrorBanner } from "../components/ProfileContactForm";
import ProfilePhotoField from "../components/ProfilePhotoField";
import NameFields from "../components/NameFields";
import { ReadOnlyEmailField } from "../components/ContactFields";
import {
  EMPTY_CONTACT_PROFILE,
  validateNanpPhone,
  validateRequiredPayment,
  profileContactsToApi,
  mapContactError,
} from "../utils/profileForm";
import { hasRequiredPayment } from "../utils/contactFields";

export default function Onboarding({ onComplete }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = searchParams.get("step") === "contacts" ? "contacts" : "profile";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profile, setProfile] = useState(EMPTY_CONTACT_PROFILE);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");

  useEffect(() => {
    if (searchParams.get("step") === "contacts" || searchParams.get("step") === "profile") return;
    setSearchParams({ step: "profile" }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmailDisplay(user.email);
      const meta = user?.user_metadata || {};
      if (meta.first_name) setFirstName(String(meta.first_name));
      if (meta.last_name) setLastName(String(meta.last_name));
    })();
  }, []);

  function onFieldChange(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function handleAvatarSelect(file) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function goToContacts() {
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSearchParams({ step: "contacts" });
  }

  const handleFinish = async () => {
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      setSearchParams({ step: "profile" }, { replace: true });
      return;
    }

    const phoneCheck = validateNanpPhone(profile.phone);
    if (!phoneCheck.ok) {
      setError(phoneCheck.error);
      setSearchParams({ step: "contacts" }, { replace: true });
      return;
    }

    const payCheck = validateRequiredPayment(profile);
    if (!payCheck.ok) {
      setError(payCheck.error);
      setSearchParams({ step: "contacts" }, { replace: true });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign up again.");
        setLoading(false);
        return;
      }

      const { error: createError } = await createProfile({
        phone: profile.phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user.email,
        referralSource: user.user_metadata?.referral_source || null,
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

  const initials = `${firstName.trim().charAt(0) || ""}${lastName.trim().charAt(0) || ""}`.toUpperCase();
  const contactsReady = validateNanpPhone(profile.phone).ok && hasRequiredPayment(profile);

  return (
    <div className="page fadein">
      <div style={{ padding: "52px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
          {step === "profile" ? "Set up your profile" : "How people reach you"}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          {step === "profile"
            ? "Add your name and a photo. You can change these later."
            : "Phone plus one way to get paid. Don't remember Venmo? Choose cash for now."}
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {step === "profile" ? (
          <>
            <ProfilePhotoField
              onAvatarSelect={handleAvatarSelect}
              onError={setError}
              avatarDisplayUrl={avatarPreview}
              avatarFallback={
                initials
                  ? { initials, color: "#6366f1" }
                  : { placeholder: <Camera size={24} color="var(--fg4)" /> }
              }
              withCosmetics={false}
            />
            <NameFields
              idPrefix="onboard"
              firstName={firstName}
              lastName={lastName}
              onFirstName={setFirstName}
              onLastName={setLastName}
            />
            <ReadOnlyEmailField emailDisplay={emailDisplay} />
            <FormErrorBanner error={error} />
            <button
              type="button"
              className="btn bp bfull blg"
              style={{ marginTop: 4 }}
              onClick={goToContacts}
            >
              Next
            </button>
          </>
        ) : (
          <>
            <ProfileContactForm
              profile={profile}
              onFieldChange={onFieldChange}
              emailDisplay={emailDisplay}
              error={error}
              onError={setError}
              phoneRequired
              showAvatar={false}
              showEmail={false}
            />
            <button
              type="button"
              className="btn bp bfull blg"
              style={{ marginTop: 4, opacity: loading || !contactsReady ? 0.55 : 1 }}
              onClick={handleFinish}
              disabled={loading || !contactsReady}
            >
              {loading ? <Loader size={16} className="spin" /> : "Save"}
            </button>
            <button type="button" className="btn bg-btn bfull" onClick={() => setSearchParams({ step: "profile" })} disabled={loading}>
              Back
            </button>
          </>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
