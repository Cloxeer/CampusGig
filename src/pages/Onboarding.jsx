import { useState, useRef } from "react";
import { Lock, AtSign, Phone, Loader, Camera } from "lucide-react";
import { createProfile, uploadAvatar } from "../lib/profile";
import { supabase } from "../lib/supabase";

export default function Onboarding({ onComplete }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    venmo: "",
    cashapp: "",
    paypal: "",
    snapchat: "",
    phone: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (!profile.phone.trim()) {
      setError("Phone number is required.");
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
        venmo: profile.venmo.trim() || null,
        cashapp: profile.cashapp.trim() || null,
        paypal: profile.paypal.trim() || null,
        snapchat: profile.snapchat.trim() || null,
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

    if (!profile.phone.trim()) {
      setError("Phone number is required — it's the only field you can't skip.");
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
          Phone is required. Everything else is optional — update anytime.
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Profile photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          >
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
          <button
            className="btn bg-btn bsm"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? "Change photo" : "Add photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="callout">
          <div className="ci">
            <Lock size={13} />
          </div>
          <span className="ct">
            <strong>Payment info is private.</strong> Only shared with the other party once you both accept a gig.
          </span>
        </div>

        <div className="field">
          <label className="lbl">
            Phone <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 600 }}>required</span>
          </label>
          <div className="ig">
            <div className="iad">
              <Phone size={13} />
            </div>
            <input
              className="ii"
              placeholder="+1 (000) 000-0000"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            Snapchat <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>optional</span>
          </label>
          <div className="ig">
            <div className="iad" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500 }}>@</div>
            <input
              className="ii"
              placeholder="yoursnapchat"
              value={profile.snapchat}
              onChange={(e) => setProfile({ ...profile, snapchat: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            Venmo <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>optional</span>
          </label>
          <div className="ig">
            <div className="iad" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500 }}>@</div>
            <input
              className="ii"
              placeholder="yourvenmo"
              value={profile.venmo}
              onChange={(e) => setProfile({ ...profile, venmo: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            Cash App <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>optional</span>
          </label>
          <div className="ig">
            <div className="iad" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500 }}>$</div>
            <input
              className="ii"
              placeholder="yourcashtag"
              value={profile.cashapp}
              onChange={(e) => setProfile({ ...profile, cashapp: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            PayPal <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>optional</span>
          </label>
          <div className="ig">
            <div className="iad">
              <AtSign size={13} />
            </div>
            <input
              className="ii"
              placeholder="email or @handle"
              value={profile.paypal}
              onChange={(e) => setProfile({ ...profile, paypal: e.target.value })}
            />
          </div>
        </div>

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
