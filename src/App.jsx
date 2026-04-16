import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import MagicLink from "./pages/MagicLink";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Onboarding from "./pages/Onboarding";
import AppIntro from "./pages/AppIntro";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import PostGig from "./pages/PostGig";
import Alerts from "./pages/Alerts";
import GigDetails from "./pages/GigDetails";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import BottomNav from "./components/BottomNav";
import DesktopSidebar from "./components/DesktopSidebar";
import DesktopFooter from "./components/DesktopFooter";
import { supabase } from "./lib/supabase";
import { getMyProfile, getUnreadNotificationCount, cancelPendingAccountDeletion } from "./lib/profile";
import { queryClient, queryKeys } from "./lib/queryClient";

function NavLayout({ unreadCount }) {
  return (
    <div className="nav-layout">
      <DesktopSidebar unreadCount={unreadCount} />
      <div className="nav-layout__main">
        <div className="nav-layout__main-fill">
          <Outlet />
        </div>
      </div>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const profileCheckRef = useRef(false);

  const { data: profileQueryData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
    enabled: !!session && hasProfile,
    staleTime: 0,
  });
  const profileForIntro = profileQueryData?.profile;
  const needsAppIntro = !!(hasProfile && profileForIntro && !profileForIntro.app_intro_completed_at);

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUserId && hasProfile && !needsAppIntro,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setSession(s);
        if (s) {
          setCurrentUserId(s.user.id);
          // Fresh sign-in (not tab refresh) cancels a scheduled account deletion — proves @nmsu.edu access again.
          if (event === "SIGNED_IN") {
            cancelPendingAccountDeletion().then(({ cancelled, error }) => {
              if (!error && cancelled) {
                queryClient.invalidateQueries({ queryKey: queryKeys.accountDeletion });
              }
            });
          }
          checkProfile();
        } else {
          setAuthLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setCurrentUserId(null);
        setHasProfile(false);
        profileCheckRef.current = false;
        queryClient.clear();
      } else if (event === "TOKEN_REFRESHED") {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  async function checkProfile() {
    if (profileCheckRef.current) return;
    profileCheckRef.current = true;

    try {
      const result = await queryClient.fetchQuery({
        queryKey: queryKeys.myProfile,
        queryFn: getMyProfile,
        staleTime: 0,
      });
      if (result.error && !result.profile) {
        setHasProfile(false);
      } else {
        setHasProfile(!!result.profile);
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
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
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
            element={
              <Onboarding
                onComplete={() => {
                  queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
                  setHasProfile(true);
                }}
              />
            }
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </div>
    );
  }

  if (hasProfile && profilePending && !profileForIntro) {
    return (
      <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Loading…</div>
      </div>
    );
  }

  if (needsAppIntro) {
    return (
      <div className="shell">
        <Routes>
          <Route path="/app-intro" element={<AppIntro />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/app-intro" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="shell shell--session">
      <div className="shell-view">
        <Routes>
          <Route element={<NavLayout unreadCount={unreadCount} />}>
            <Route path="/" element={<Home currentUserId={currentUserId} />} />
            <Route path="/explore" element={<Explore currentUserId={currentUserId} />} />
            <Route path="/post" element={<PostGig />} />
            <Route path="/alerts" element={<Alerts currentUserId={currentUserId} />} />
            <Route path="/profile" element={<Profile currentUserId={currentUserId} />} />
          </Route>
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/app-intro" element={<AppIntro />} />
          <Route path="/gigdetails/:gigId" element={<GigDetails currentUserId={currentUserId} />} />
          <Route path="/users/:userId" element={<UserProfile currentUserId={currentUserId} />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <DesktopFooter />
    </div>
  );
}
