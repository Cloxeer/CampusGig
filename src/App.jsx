import { useState, useEffect, useCallback } from "react";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import MagicLink from "./pages/MagicLink";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import PostGig from "./pages/PostGig";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import UserProfile from "./pages/UserProfile";
import RepDetailModal from "./components/modals/RepDetailModal";
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";
import { getMyProfile, getUnreadNotificationCount } from "./lib/profile";

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [authMode, setAuthMode] = useState("signup");
  const [magicEmail, setMagicEmail] = useState("");
  const [showRepDetail, setShowRepDetail] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  const refreshUnread = useCallback(async () => {
    const { count } = await getUnreadNotificationCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setCurrentUserId(s.user.id);
        checkProfileAndRoute(s);
      } else {
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        setCurrentUserId(s.user.id);
        checkProfileAndRoute(s);
      } else {
        setCurrentUserId(null);
        setUnreadCount(0);
        setScreen("splash");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    refreshUnread();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` },
        () => refreshUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refreshUnread]);

  async function checkProfileAndRoute(s) {
    if (!s) {
      setAuthLoading(false);
      return;
    }
    const { profile } = await getMyProfile();
    if (profile) {
      setScreen("home");
    } else {
      setScreen("onboarding");
    }
    setAuthLoading(false);
  }

  const handleSetScreen = (newScreen, payload) => {
    if (newScreen === "auth" && payload) {
      setAuthMode(payload);
    }
    if (newScreen === "magic" && payload) {
      setMagicEmail(payload);
    }
    if (newScreen === "repDetail") {
      setShowRepDetail(true);
      return;
    }
    if (newScreen === "userProfile" && payload) {
      setViewUserId(payload);
    }
    setScreen(newScreen);
  };

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
      {screen === "magic" && <MagicLink setScreen={handleSetScreen} email={magicEmail} />}
      {screen === "onboarding" && <Onboarding setScreen={handleSetScreen} />}
      {screen === "home" && <Home setScreen={handleSetScreen} currentUserId={currentUserId} />}
      {screen === "explore" && <Explore setScreen={handleSetScreen} currentUserId={currentUserId} />}
      {screen === "post" && <PostGig setScreen={handleSetScreen} />}
      {screen === "alerts" && <Alerts setScreen={handleSetScreen} onNotificationsRead={refreshUnread} />}
      {screen === "profile" && <Profile setScreen={handleSetScreen} />}
      {screen === "editProfile" && <EditProfile setScreen={handleSetScreen} />}
      {screen === "userProfile" && <UserProfile setScreen={handleSetScreen} userId={viewUserId} />}

      {["home", "explore", "alerts", "profile", "post"].includes(screen) && (
        <BottomNav screen={screen} setScreen={handleSetScreen} unreadCount={unreadCount} />
      )}

      {showRepDetail && <RepDetailModal onClose={() => setShowRepDetail(false)} />}
    </div>
  );
}
