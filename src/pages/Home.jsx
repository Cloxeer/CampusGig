import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getAvatarUrl } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";
import { getLevel, useTimer } from "../utils/helpers";
import { useOpenGigsQuery } from "../hooks/useOpenGigsQuery";
import { useLegacyGigRedirect } from "../hooks/useLegacyGigRedirect";
import Logo, { LogoMark } from "../components/Logo";
import GigCard from "../components/GigCard";
import UserAvatar from "../components/UserAvatar";
import ProfileRepCard from "../features/profile/components/ProfileRepCard";
import AppSkeleton from "../components/AppSkeleton";
import { FILTERABLE_CATEGORY_LABELS } from "../data/categories";

/* "All" plus every real category (except the "Other" catch-all, which folds
   into All). Sourced from the shared catalog so the tabs and the Post-a-gig
   picker can never drift apart. */
const TABS = ["All", ...FILTERABLE_CATEGORY_LABELS];

export default function Home({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("All");
  const tick = useTimer();

  const isAuthed = Boolean(currentUserId);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
    enabled: isAuthed,
  });

  const { gigs, isPending: gigsPending } = useOpenGigsQuery();

  const profile = profileData?.profile || null;
  const avatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;
  /** Full-page skeleton only when we have never loaded the profile (no cache). Anon visitors have no profile, so skip straight to the feed. */
  const showFullSkeleton = isAuthed && profilePending;

  useEffect(() => {
    if (searchParams.get("rep")) {
      navigate("/profile/rep", { replace: true, state: { returnTo: "/" } });
    }
  }, [searchParams, navigate]);

  useLegacyGigRedirect("/");

  const repScore = profile?.rep_score || 0;
  const lvl = getLevel(repScore);

  const activeGigs = gigs.filter((g) => {
    if (!g.deadline) return true;
    return g.deadline > Date.now();
  });

  const filteredGigs = activeGigs.filter((g) => {
    if (tab === "All") return true;
    return g.cat === tab;
  });

  if (showFullSkeleton) return <AppSkeleton />;

  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <LogoMark />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isAuthed ? (
            <>
              <button className="btn bg-btn bico" onClick={() => navigate("/explore")}>
                <Search size={15} />
              </button>
              <div onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
                <UserAvatar
                  user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile?.avatar_color, first_name: profile?.first_name, last_name: profile?.last_name }}
                  size="sm"
                  withCosmetics
                />
              </div>
            </>
          ) : (
            <button className="btn bp" style={{ fontSize: 13, padding: "6px 14px" }} onClick={() => navigate("/welcome")}>
              Welcome
            </button>
          )}
        </div>
      </div>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ margin: "14px 16px 0" }}>
          <ProfileRepCard
            variant={isAuthed ? "self" : "guest"}
            repScore={repScore}
            lvl={lvl}
            onRepPath={() => navigate("/profile/rep", { state: { returnTo: "/" } })}
          />
        </div>

        <div style={{ padding: "0 16px" }}>
          <div className="tabs" style={{ margin: "14px -16px 0", padding: "0 16px" }}>
            {TABS.map((t) => (
              <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-.01em" }}>
            {filteredGigs.length} open gig{filteredGigs.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="gig-grid" style={{ padding: "0 16px" }}>
          {gigsPending ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
              ))}
            </>
          ) : filteredGigs.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
              No gigs yet — be the first to post one!
            </div>
          ) : (
            filteredGigs.map((g) => (
              <GigCard
                key={g.id}
                gig={g}
                tick={tick}
                onClick={() => navigate(`/gig/${g.id}`, { state: { returnTo: "/" } })}
              />
            ))
          )}
        </div>
        <div style={{ height: 16 }} />
      </div>

    </div>
  );
}
