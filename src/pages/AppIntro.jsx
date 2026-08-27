import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { navigateBack } from "../utils/navBack";
import { useQuery } from "@tanstack/react-query";
import { Home, Compass, PlusCircle, Bell, User, Mail, ArrowRight, ArrowLeft, Loader } from "lucide-react";
import { BrandLockup } from "../components/Logo";
import SettingsRowToggle from "../components/SettingsRowToggle";
import SpotMascot from "../components/SpotMascot";
import { getMyProfile, updateMyProfile } from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";

const CONTENT_SLIDES = [
  {
    icon: Home,
    title: "Home",
    body: "Your feed of campus gigs — scroll here first to see what’s open and what’s happening nearby.",
  },
  {
    icon: Compass,
    title: "Explore",
    body: "Search and browse listings. Find work you want or skim categories that fit your schedule.",
  },
  {
    icon: PlusCircle,
    title: "Post",
    body: "Need something done? Post a gig. Other verified students can request it or take it.",
  },
  {
    icon: Bell,
    title: "Alerts",
    body: "The bell is your inbox — requests, updates, and reviews for gigs you’re involved in.",
  },
  {
    icon: User,
    title: "Profile",
    body: "Your rep, reviews, and activity live here. Open the menu (top right) for Settings and more.",
  },
];

/* Spot rides along the onboarding: a spot beside each screen's icon + a short,
   cool-and-sweet hint script when you click him (he introduces himself, then
   explains that screen). `msgs` order matches the 5 CONTENT_SLIDES + the final
   Email slide. */
const SPOT_ONBOARDING = [
  {
    mood: "attentive", flip: true, pos: { top: -8, left: "calc(50% + 34px)" },
    chatId: "onboarding-home",
    script: { intro: "Spot here. Welcome in — I'm Spot.", hints: ["This is Home — your gig feed.", "Scroll to see what's open."], closer: "I'll be around." },
  },
  {
    mood: "excited", flip: false, pos: { top: -8, right: "calc(50% + 34px)" },
    chatId: "onboarding-explore",
    script: { intro: "Oh hey — I'm Spot.", hints: ["Explore is the hunt.", "Search, browse, filter to fit."] },
  },
  {
    mood: "attentive", flip: true, pos: { top: -8, left: "calc(50% + 34px)" },
    chatId: "onboarding-post",
    script: { intro: "Spot, at your service.", hints: ["Need something done? Post it.", "Set a price. A student takes it."] },
  },
  {
    mood: "attentive", flip: false, pos: { top: -8, right: "calc(50% + 34px)" },
    chatId: "onboarding-alerts",
    script: { intro: "Name's Spot, by the way.", hints: ["The bell is your inbox.", "Requests, updates, reviews."] },
  },
  {
    mood: "excited", flip: true, pos: { top: -8, left: "calc(50% + 34px)" },
    chatId: "onboarding-profile",
    script: { intro: "Spot here.", hints: ["This one's you.", "Rep, reviews, your history.", "Menu's top-right for Settings."], closer: "Make it yours." },
  },
  {
    mood: "neutral", flip: false, pos: { top: -8, right: "calc(50% + 34px)" },
    chatId: "onboarding-email",
    script: { intro: "Spot again.", hints: ["Emails: only what matters.", "No spam. Ever."], closer: "Flip it anytime in Settings." },
  },
];

export default function AppIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const spotTarget = useRef(null);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  const profile = profileData?.profile;
  const isRequired = !!(profile && !profile.app_intro_completed_at);
  const isReplay = !!profile?.app_intro_completed_at;

  const [searchParams, setSearchParams] = useSearchParams();
  const stepCount = CONTENT_SLIDES.length + 1;
  const rawStep = Number.parseInt(searchParams.get("step"), 10);
  const step = Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= stepCount ? rawStep : 1;
  const slide = step - 1;
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Spot pops out, hops to the new screen's spot while hidden, then pops in —
     so he never slides across the copy between screens. */
  const [spotSlide, setSpotSlide] = useState(0);
  const [spotShow, setSpotShow] = useState(true);
  useEffect(() => {
    if (slide === spotSlide) return undefined;
    setSpotShow(false);
    const t = setTimeout(() => {
      setSpotSlide(slide);
      setSpotShow(true);
    }, 230);
    return () => clearTimeout(t);
  }, [slide, spotSlide]);

  const returnTo = typeof location.state?.returnTo === "string" ? location.state.returnTo : "/";

  useEffect(() => {
    if (searchParams.get("step") === String(step)) return;
    const next = new URLSearchParams(searchParams);
    next.set("step", String(step));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, step]);

  useEffect(() => {
    if (profile?.email_alerts_enabled !== undefined && profile?.email_alerts_enabled !== null) {
      setEmailOptIn(!!profile.email_alerts_enabled);
    }
  }, [profile?.email_alerts_enabled]);

  const isEmailSlide = slide === CONTENT_SLIDES.length;

  async function persistIntro(updates) {
    const { error: err } = await updateMyProfile(updates);
    if (err) {
      setError(typeof err.message === "string" ? err.message : "Couldn’t save. Try again.");
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    return true;
  }

  async function handleFinish() {
    setError("");
    if (isReplay) {
      navigate(returnTo === "/app-intro" ? "/" : returnTo, { replace: true });
      return;
    }
    setSaving(true);
    try {
      const ok = await persistIntro({
        app_intro_completed_at: new Date().toISOString(),
        email_alerts_enabled: emailOptIn,
      });
      if (ok) navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (isReplay) {
      navigate(returnTo === "/app-intro" ? "/" : returnTo, { replace: true });
      return;
    }
    setError("");
    setSaving(true);
    try {
      const ok = await persistIntro({
        app_intro_completed_at: new Date().toISOString(),
      });
      if (ok) navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (slide < CONTENT_SLIDES.length) {
      navigate(`/app-intro?step=${step + 1}`);
    }
  }

  function goBack() {
    if (slide > 0) navigateBack(navigate, `/app-intro?step=${step - 1}`);
  }

  const EMAIL_ALERTS_HINT =
    "Transactional emails to your inbox for important gig alerts and reviews (account-wide). Turn off anytime.";

  const IconCmp = isEmailSlide ? Mail : CONTENT_SLIDES[slide].icon;
  const title = isEmailSlide ? "Email alerts" : CONTENT_SLIDES[slide].title;
  const body = isEmailSlide
    ? "Same switch as Settings → Alerts. Not ads — only transactional notices about gigs and reviews."
    : CONTENT_SLIDES[slide].body;

  if (profilePending && !profile) {
    return (
      <div className="splash fadein" style={{ minHeight: "100vh", justifyContent: "center", alignItems: "center", display: "flex" }}>
        <Loader className="spin" size={22} color="var(--fg3)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="splash fadein" style={{ minHeight: "100vh", justifyContent: "center", alignItems: "center", display: "flex", padding: 24 }}>
        <p style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)", textAlign: "center" }}>Couldn’t load your profile. Try again from Home.</p>
      </div>
    );
  }

  return (
    <div className="splash fadein">
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Replay (already onboarded) has no Skip and no footer Back on the
              first screen — give it a clean way out. */}
          {isReplay && slide === 0 && (
            <button
              type="button"
              className="btn bg-btn bico"
              aria-label="Back"
              onClick={() => navigateBack(navigate, returnTo === "/app-intro" ? "/" : returnTo)}
              style={{ marginRight: 2 }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <BrandLockup markSize={28} logoSize={16} markStyle={{ borderRadius: "var(--r)" }} />
        </div>
        {isRequired && (
          <button type="button" className="btn bg-btn" style={{ fontSize: 12, color: "var(--fg3)" }} onClick={handleSkip} disabled={saving}>
            Skip
          </button>
        )}
      </div>

      <div className="splash-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="sfade" />
        <div
          ref={spotTarget}
          className="shell-prose"
          style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}
        >
          {/* Spot rides along — click him for a hint about this screen. */}
          <SpotMascot
            key="onboarding-spot"
            float={false}
            show={spotShow}
            size={72}
            mood={(SPOT_ONBOARDING[spotSlide] || SPOT_ONBOARDING[0]).mood}
            flip={(SPOT_ONBOARDING[spotSlide] || SPOT_ONBOARDING[0]).flip}
            script={(SPOT_ONBOARDING[spotSlide] || SPOT_ONBOARDING[0]).script}
            chatId={(SPOT_ONBOARDING[spotSlide] || SPOT_ONBOARDING[0]).chatId}
            bubbleSide="top"
            lookAtRef={spotTarget}
            style={(SPOT_ONBOARDING[spotSlide] || SPOT_ONBOARDING[0]).pos}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fg2)",
              marginBottom: 24,
            }}
          >
            <IconCmp size={28} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.03em", color: "var(--fg)", marginBottom: 10, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.65, maxWidth: 320 }}>{body}</div>

          {isEmailSlide && (
            <div style={{ width: "100%", maxWidth: 360, marginTop: 24 }}>
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--bd)",
                  borderRadius: "var(--r)",
                  padding: "0 14px",
                }}
              >
                <SettingsRowToggle
                  icon={Mail}
                  label="Email alerts"
                  hint={EMAIL_ALERTS_HINT}
                  checked={emailOptIn}
                  onChange={setEmailOptIn}
                  isLast
                  disabled={isReplay}
                />
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--fg4)",
                  fontFamily: "var(--mono)",
                  lineHeight: 1.45,
                  margin: "12px 0 0",
                  textAlign: "center",
                }}
              >
                You can change this anytime in Settings: Profile menu (top right) → Settings → Alerts.
              </p>
            </div>
          )}

          {error ? (
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 16, fontFamily: "var(--mono)" }}>{error}</p>
          ) : null}
        </div>
      </div>

      <div className="sfoot">
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          {Array.from({ length: CONTENT_SLIDES.length + 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === slide ? "var(--ink)" : "var(--bd2)",
                transition: "background .2s, transform .2s",
                transform: i === slide ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {isEmailSlide ? (
          <button type="button" className="btn bp bfull blg" onClick={handleFinish} disabled={saving}>
            {saving ? <Loader size={16} className="spin" /> : null}
            {isReplay ? "Done" : "Enter CampusGig"}
            {!saving && !isReplay ? <ArrowRight size={16} /> : null}
          </button>
        ) : (
          <button type="button" className="btn bp bfull blg" onClick={goNext}>
            Continue <ArrowRight size={16} />
          </button>
        )}

        {slide > 0 && (
          <button type="button" className="btn bg-btn bfull" style={{ color: "var(--fg3)", fontSize: 13 }} onClick={goBack}>
            <ArrowLeft size={13} /> Back
          </button>
        )}
      </div>
    </div>
  );
}
