import { useState, useEffect, useRef } from "react";
import { Lock, AtSign, Phone, Loader, Camera } from "lucide-react";
import { getMyProfile, updateMyProfile, uploadAvatar, getAvatarUrl } from "../lib/profile";

/** Strip to US NANP digits: optional leading 1, then up to 10 national digits. */
function nanpDigitsFromInput(raw) {
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d[0] === "1") return d.slice(0, 11);
  return d.slice(0, 10);
}

/** Format NANP digit string (from nanpDigitsFromInput) as +1 (AAA) BBB-CCCC */
function formatNanpDisplay(digits) {
  if (!digits) return "";
  const rest = digits[0] === "1" ? digits.slice(1) : digits;
  if (rest.length === 0) return "+1";
  let s = "+1 (" + rest.slice(0, 3);
  if (rest.length <= 3) return s;
  s += ") " + rest.slice(3, 6);
  if (rest.length <= 6) return s;
  return s + "-" + rest.slice(6, 10);
}

function phoneFromStored(stored) {
  const d = String(stored ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return formatNanpDisplay(d);
  if (d.length === 10) return formatNanpDisplay("1" + d);
  if (d[0] === "1") return formatNanpDisplay(d.slice(0, 11));
  return formatNanpDisplay(d.slice(0, 10));
}

export default function EditProfile({ setScreen }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    venmo: "",
    cashapp: "",
    paypal: "",
    snapchat: "",
    phone: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [initials, setInitials] = useState("");
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { profile: p } = await getMyProfile();
    if (p) {
      setProfile({
        venmo: p.venmo || "",
        cashapp: p.cashapp || "",
        paypal: p.paypal || "",
        snapchat: p.snapchat || "",
        phone: phoneFromStored(p.phone),
      });
      setInitials(
        `${p.first_name?.charAt(0) || ""}${p.last_name?.charAt(0) || ""}`.toUpperCase()
      );
      setAvatarColor(p.avatar_color || "#6366f1");
      if (p.avatar_url) {
        const url = getAvatarUrl(p.avatar_url);
        if (url) setAvatarUrl(url);
      }
    }
    setLoading(false);
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
        venmo: profile.venmo.trim() || null,
        cashapp: profile.cashapp.trim() || null,
        paypal: profile.paypal.trim() || null,
        snapchat: profile.snapchat.trim() || null,
      });

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setScreen("profile");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          onClick={() => setScreen("profile")}
          aria-label="Back to profile"
          style={{ marginBottom: 10 }}
        >
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
          Edit profile
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          Phone is required. Everything else is optional.
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Profile photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          >
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
          <button
            className="btn bg-btn bsm"
            onClick={() => fileInputRef.current?.click()}
          >
            {displayUrl ? "Change photo" : "Add photo"}
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
              inputMode="numeric"
              autoComplete="tel-national"
              value={profile.phone}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  phone: formatNanpDisplay(nanpDigitsFromInput(e.target.value)),
                })
              }
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
          style={{ marginTop: 4, opacity: saving ? 0.7 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader size={16} className="spin" /> : "Save changes"}
        </button>
        <button className="btn bg-btn bfull" onClick={() => setScreen("profile")} disabled={saving}>
          Cancel
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
