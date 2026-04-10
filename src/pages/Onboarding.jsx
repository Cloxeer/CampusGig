import { useState } from "react";
import { Lock, AtSign, Phone, Loader } from "lucide-react";
import { createProfile } from "../lib/profile";
import { supabase } from "../lib/supabase";

export default function Onboarding({ setScreen }) {
  const [profile, setProfile] = useState({
    venmo: "",
    cashapp: "",
    paypal: "",
    snapchat: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setError("");

    // Phone is required
    if (!profile.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    setLoading(true);

    try {
      // Get the current auth user to pull first/last name and email
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

      setScreen("home");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError("");

    // Even when skipping, phone is required
    if (!profile.phone.trim()) {
      setError("Phone number is required — it's the only field you can't skip.");
      return;
    }

    // Same as finish but with only required field
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
        <div className="callout">
          <div className="ci">
            <Lock size={13} />
          </div>
          <span className="ct">
            <strong>Payment info is private.</strong> Only shared with the other party once you both accept a gig.
          </span>
        </div>

        {/* Phone — required */}
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

        {/* Snapchat — optional */}
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

        {/* Venmo — optional */}
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

        {/* Cash App — optional */}
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

        {/* PayPal — optional */}
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
