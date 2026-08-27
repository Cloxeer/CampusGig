import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
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
import OpenGig from "./pages/OpenGig";
import Profile from "./pages/Profile";
import ProfileRep from "./pages/ProfileRep";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import AsnmsuDiscounts from "./pages/AsnmsuDiscounts";
import BottomNav from "./components/BottomNav";
import DesktopSidebar from "./components/DesktopSidebar";
import DesktopFooter from "./components/DesktopFooter";
import AppSkeleton from "./components/AppSkeleton";
import { supabase } from "./lib/supabase";
import { getMyProfile, getUnreadNotificationCount, cancelPendingAccountDeletion } from "./lib/profile";
import { queryClient, queryKeys } from "./lib/queryClient";

const INDEXABLE_PATHS = new Set(["/", "/welcome", "/welcome/how-it-works", "/terms", "/privacy"]);

/** Full-screen routes that DON'T resolve into the nav shell. On these the feed
 *  skeleton would flash the wrong layout, so they keep a plain centered loader. */
const FULLSCREEN_LOADING_PATHS = new Set([
  "/welcome", "/welcome/how-it-works", "/auth", "/magic", "/terms", "/privacy", "/onboarding", "/app-intro",
]);
function isShellLoadingRoute() {
  const p = window.location.pathname;
  if (p.startsWith("/gig/")) return false;
  return !FULLSCREEN_LOADING_PATHS.has(p);
}

/**
 * The single loading state for every auth/profile gate. Reserves the real nav
 * shell + Home skeleton so content drops into place instead of replacing a
 * centered spinner (the big CLS win). On full-screen routes it falls back to a
 * neutral centered loader so we don't flash a feed skeleton before a splash/gig.
 */
function AppLoading() {
  if (!isShellLoadingRoute()) {
    return (
      <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Loading…</div>
      </div>
    );
  }
  return (
    <div className="shell shell--session">
      <div className="shell-view">
        <AppSkeleton />
      </div>
      <DesktopFooter />
    </div>
  );
}

/** `/profile/:userId` — redirect to `/profile` when viewing your own id (bookmark parity). */
function ProfileByIdRoute({ currentUserId }) {
  const { userId } = useParams();
  const location = useLocation();
  if (currentUserId && userId && String(userId) === String(currentUserId)) {
    return <Navigate to="/profile" replace state={location.state} />;
  }
  return <Profile currentUserId={currentUserId} />;
}

/** Legacy `/users/:id` links → `/profile/:id`. */
function UsersToProfileRedirect() {
  const { userId } = useParams();
  return <Navigate to={`/profile/${userId}`} replace />;
}

/** Anon hit an auth-required action (posting). Prompt sign-in → welcome. */
function AnonAuthGate() {
  const navigate = useNavigate();
  return (
    <div className="page fadein">
      <div className="scroll scroll--nav-pad" style={{ padding: "56px 20px" }}>
        <div
          style={{
            maxWidth: 360,
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 4px",
              color: "var(--fg2)",
            }}
          >
            <LogIn size={24} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.03em" }}>
            Sign in to post a gig
          </div>
          <div style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.6 }}>
            Posting needs a free account. Browsing stays open — no account needed to look around.
          </div>
          <button className="btn bp bfull blg" style={{ marginTop: 6 }} onClick={() => navigate("/welcome")}>
            Continue to sign in
          </button>
          <button className="btn bo bfull" onClick={() => navigate("/")}>
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}

function NavLayout({ unreadCount }) {
  const { pathname } = useLocation();
  const hideBottomNav = pathname === "/profile/rep";

  return (
    <div className="nav-layout">
      <DesktopSidebar unreadCount={unreadCount} />
      <div className="nav-layout__main">
        <div className={`nav-layout__main-fill${hideBottomNav ? " nav-layout__main-fill--no-bnav" : ""}`}>
          <Outlet />
        </div>
      </div>
      {!hideBottomNav ? <BottomNav unreadCount={unreadCount} /> : null}
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const profileCheckRef = useRef(false);

  useEffect(() => {
    const shouldIndex = INDEXABLE_PATHS.has(location.pathname);
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute(
      "content",
      shouldIndex ? "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" : "noindex,nofollow,noarchive"
    );
  }, [location.pathname]);

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
    // Show the loading screen (not the onboarding form) while we verify whether
    // this signed-in user has a profile. Without this, a fresh SIGNED_IN after
    // authLoading has gone false briefly renders <Onboarding> — the contact form
    // flash — until this async check resolves hasProfile.
    setAuthLoading(true);

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
    return <AppLoading />;
  }

  if (!session) {
    return (
      <div className="shell shell--session">
        <div className="shell-view">
          <Routes>
            {/* Anon gets the full nav. Home + Explore are freely browsable
                (read-only, outsider gigs only — enforced by RLS). Auth-required
                tabs send them to the welcome/sign-in screen. */}
            <Route element={<NavLayout unreadCount={0} />}>
              <Route path="/" element={<Home currentUserId={null} />} />
              <Route path="/explore" element={<Explore currentUserId={null} />} />
              <Route path="/post" element={<AnonAuthGate />} />
              <Route path="/alerts" element={<Navigate to="/welcome" replace />} />
              <Route path="/profile" element={<Navigate to="/welcome" replace />} />
              <Route path="/profile/rep" element={<ProfileRep />} />
              <Route path="/inventory" element={<Inventory />} />
            </Route>
            {/* Full-screen (no-nav) public surfaces + sign-in / marketing routes. */}
            <Route path="/gig/:gigId" element={<OpenGig currentUserId={null} />} />
            <Route path="/welcome" element={<Splash />} />
            <Route path="/welcome/how-it-works" element={<Splash />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/magic" element={<MagicLink />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <DesktopFooter />
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
    return <AppLoading />;
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
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile/rep" element={<ProfileRep />} />
            <Route path="/profile" element={<Profile currentUserId={currentUserId} />} />
          </Route>
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/:userId" element={<ProfileByIdRoute currentUserId={currentUserId} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/asnmsu/discounts" element={<AsnmsuDiscounts />} />
          <Route path="/app-intro" element={<AppIntro />} />
          <Route path="/welcome" element={<Splash />} />
          <Route path="/welcome/how-it-works" element={<Splash />} />
          <Route path="/gig/:gigId" element={<OpenGig currentUserId={currentUserId} />} />
          <Route path="/users/:userId" element={<UsersToProfileRedirect />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <DesktopFooter />
    </div>
  );
}
