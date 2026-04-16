import { useState, useRef, useEffect } from "react";
import { Camera, Loader } from "lucide-react";
import { createProfile, uploadAvatar } from "../lib/profile";
import { supabase } from "../lib/supabase";
import ContactFields from "../components/ContactFields";
import { nanpDigitsFromInput } from "../utils/phoneNanp";

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
};

function trimOrNull(s) {
  const t = s != null ? String(s).trim() : "";
  return t === "" ? null : t;
}

export default function Onboarding({ onComplete }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(EMPTY);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailDisplay, setEmailDisplay] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmailDisplay(user.email);
    })();
  }, []);

  function onFieldChange(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
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

  const handleFinish = async () => {
    setError("");

    const phoneDigits = nanpDigitsFromInput(profile.phone);
    const nationalLen = phoneDigits[0] === "1" ? phoneDigits.length - 1 : phoneDigits.length;
    if (!phoneDigits || nationalLen !== 10) {
      setError("Enter a valid 10-digit US phone number.");
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
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
        email: user.email,
        venmo: trimOrNull(profile.venmo),
        cashapp: trimOrNull(profile.cashapp),
        paypal: trimOrNull(profile.paypal),
        snapchat: trimOrNull(profile.snapchat),
        instagram: trimOrNull(profile.instagram),
        discord: trimOrNull(profile.discord),
        zelle: trimOrNull(profile.zelle),
        apple_pay: trimOrNull(profile.apple_pay),
        google_pay: trimOrNull(profile.google_pay),
      });

      if (createError) {
        setError(createError.message);
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

  const handleSkip = async () => {
    setError("");
    const phoneDigits = nanpDigitsFromInput(profile.phone);
    const nationalLen = phoneDigits[0] === "1" ? phoneDigits.length - 1 : phoneDigits.length;
    if (!phoneDigits || nationalLen !== 10) {
      setError("Phone number is required — enter a valid 10-digit US number.");
      return;
    }
    await handleFinish();
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
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
                  background: "var(--bg3)",
                  border: "2px dashed var(--bd2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--fg4)",
                }}
              >
                <Camera size={24} />
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
            {avatarPreview ? "Change photo" : "Add photo"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
        </div>

        <ContactFields
          profile={profile}
          onFieldChange={onFieldChange}
          emailDisplay={emailDisplay}
          phoneMode="formatted"
          phoneRequired
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
          style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? <Loader size={16} className="spin" /> : "Finish setup"}
        </button>
        <button className="btn bg-btn bfull" onClick={handleSkip} disabled={loading}>
          Skip optional fields
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
