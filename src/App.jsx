import { useState, useEffect } from "react";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import MagicLink from "./pages/MagicLink";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import PostGig from "./pages/PostGig";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import RepDetailModal from "./components/modals/RepDetailModal";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";
import { getMyProfile } from "./lib/profile";

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [authMode, setAuthMode] = useState("signup");
  const [showRepDetail, setShowRepDetail] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Auth state listener ──────────────────────────────
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        // User is logged in — check if they have a profile
        checkProfileAndRoute(s);
      } else {
        setAuthLoading(false);
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        checkProfileAndRoute(s);
      } else {
        setScreen("splash");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfileAndRoute(s) {
    if (!s) {
      setAuthLoading(false);
      return;
    }
    const { profile } = await getMyProfile();
    if (profile) {
      // Has profile → go to home
      setScreen("home");
    } else {
      // No profile yet → needs onboarding
      setScreen("onboarding");
    }
    setAuthLoading(false);
  }

  // Wrapper to handle screen changes with optional auth mode
  const handleSetScreen = (newScreen, mode) => {
    if (newScreen === "auth" && mode) {
      setAuthMode(mode);
    }
    if (newScreen === "repDetail") {
      setShowRepDetail(true);
      return;
    }
    setScreen(newScreen);
  };

  // Show nothing while checking initial auth
  if (authLoading) {
    return (
      <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="shell">
      {screen === "splash" && <Splash setScreen={handleSetScreen} />}
      {screen === "auth" && <Auth setScreen={handleSetScreen} initialMode={authMode} />}
      {screen === "magic" && <MagicLink setScreen={handleSetScreen} />}
      {screen === "onboarding" && <Onboarding setScreen={handleSetScreen} />}
      {screen === "home" && <Home setScreen={handleSetScreen} />}
      {screen === "explore" && <Explore setScreen={handleSetScreen} />}
      {screen === "post" && <PostGig setScreen={handleSetScreen} />}
      {screen === "alerts" && <Alerts setScreen={handleSetScreen} />}
      {screen === "profile" && <Profile setScreen={handleSetScreen} />}

      {["home", "explore", "alerts", "profile", "post"].includes(screen) && (
        <BottomNav screen={screen} setScreen={handleSetScreen} />
      )}

      {showRepDetail && <RepDetailModal onClose={() => setShowRepDetail(false)} />}
    </div>
  );
}
