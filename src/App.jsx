import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import BottomNav from "./components/BottomNav";
import { supabase } from "./lib/supabase";
import { getMyProfile, getUnreadNotificationCount } from "./lib/profile";

function NavLayout({ unreadCount }) {
  return (
    <>
      <Outlet />
      <BottomNav unreadCount={unreadCount} />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileCheckRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    const { count } = await getUnreadNotificationCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setSession(s);
        if (s) {
          setCurrentUserId(s.user.id);
          checkProfile();
        } else {
          setAuthLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setCurrentUserId(null);
        setUnreadCount(0);
        setHasProfile(false);
        profileCheckRef.current = false;
      } else if (event === "TOKEN_REFRESHED") {
        setSession(s);
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

  async function checkProfile() {
    if (profileCheckRef.current) return;
    profileCheckRef.current = true;

    try {
      const { profile, error } = await getMyProfile();
      if (error && !profile) {
        setHasProfile(false);
      } else {
        setHasProfile(!!profile);
      }
    } catch {
      setHasProfile(false);
    } finally {
      setAuthLoading(false);
      profileCheckRef.current = false;
    }
  }

  if (authLoading) {
    return (
      <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="shell">
        <Routes>
          <Route path="/welcome" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/magic" element={<MagicLink />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="shell">
        <Routes>
          <Route
            path="/onboarding"
            element={<Onboarding onComplete={() => setHasProfile(true)} />}
          />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="shell">
      <Routes>
        <Route element={<NavLayout unreadCount={unreadCount} />}>
          <Route path="/" element={<Home currentUserId={currentUserId} />} />
          <Route path="/explore" element={<Explore currentUserId={currentUserId} />} />
          <Route path="/post" element={<PostGig />} />
          <Route path="/alerts" element={<Alerts currentUserId={currentUserId} onNotificationsRead={refreshUnread} />} />
          <Route path="/profile" element={<Profile currentUserId={currentUserId} />} />
        </Route>
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/users/:userId" element={<UserProfile currentUserId={currentUserId} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
