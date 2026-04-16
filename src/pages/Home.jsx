import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getOpenGigs, getAvatarUrl, normalizeGig, requestGig, getGigById } from "../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../lib/queryClient";
import { getLevel, useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import Logo, { LogoMark } from "../components/Logo";
import GigCard from "../components/GigCard";
import UserAvatar from "../components/UserAvatar";
import GigDetailModal from "../components/modals/GigDetailModal";
import RepDetailModal from "../components/modals/RepDetailModal";

const TABS = ["Recent", "Food", "Errands", "Notes", "All"];

function HomeSkeleton() {
  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <div className="skel" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <div className="skel" style={{ width: 90, height: 16 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
          <div className="skel skel-circle" style={{ width: 30, height: 30 }} />
        </div>
      </div>
      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ padding: 16 }}>
            <div className="skel-rep" style={{ width: 140, height: 10, marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div className="skel-rep" style={{ width: 70, height: 28 }} />
              <div className="skel-rep" style={{ width: 60, height: 22, borderRadius: 5 }} />
            </div>
            <div className="skel-rep" style={{ width: "100%", height: 2, marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[40, 50, 46, 44].map((w, i) => (
                <div key={i} className="skel-rep" style={{ width: w, height: 9 }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 16px 0", display: "flex", gap: 8 }}>
          {TABS.map((t) => (
            <div key={t} className="skel" style={{ width: 52, height: 28, borderRadius: 6 }} />
          ))}
        </div>
        <div className="gig-grid" style={{ padding: "18px 16px 0" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [repOpen, openRep, closeRep] = useModalParam("rep");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [tab, setTab] = useState("Recent");
  const [requested, setRequested] = useState(false);
  const tick = useTimer();

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  const { data: gigsData, isPending: gigsPending } = useQuery({
    queryKey: queryKeys.openGigs,
    queryFn: getOpenGigs,
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  const profile = profileData?.profile || null;
  const avatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;
  const gigs = useMemo(() => (gigsData?.gigs || []).map(normalizeGig), [gigsData]);
  /** Full-page skeleton only when we have never loaded the profile (no cache). Cached profile + loading gigs still shows the header/rep card. */
  const showFullSkeleton = profilePending;

  useEffect(() => {
    setRequested(false);
  }, [gigParam]);

  const listGig = useMemo(() => {
    if (!gigParam) return undefined;
    if (gigsPending) return undefined;
    return gigs.find((g) => g.id === gigParam) ?? null;
  }, [gigParam, gigsPending, gigs]);

  const { data: modalGig, isPending: gigModalPending } = useQuery({
    queryKey: queryKeys.gigById(gigParam),
    queryFn: async () => {
      const { gig } = await getGigById(gigParam);
      return gig ?? null;
    },
    enabled: Boolean(gigParam),
    staleTime: GIG_DETAIL_STALE_MS,
    placeholderData: listGig != null ? listGig : undefined,
  });

  useEffect(() => {
    if (!gigParam) return;
    if (gigsPending) return;
    if (listGig !== null) return;
    if (!gigModalPending && modalGig === null) closeGig();
  }, [gigParam, gigsPending, listGig, gigModalPending, modalGig, closeGig]);

  const repScore = profile?.rep_score || 0;
  const lvl = getLevel(repScore);

  const activeGigs = gigs.filter((g) => {
    if (!g.deadline) return true;
    return g.deadline > Date.now();
  });

  const filteredGigs = activeGigs.filter((g) => {
    if (tab === "Recent" || tab === "All") return true;
    if (tab === "Food") return g.cat === "Food";
    if (tab === "Errands") return g.cat === "Errand";
    if (tab === "Notes") return g.cat === "Notes";
    return true;
  });

  if (showFullSkeleton) return <HomeSkeleton />;

  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <LogoMark />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn bg-btn bico" onClick={() => navigate("/explore")}>
            <Search size={15} />
          </button>
          <div onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
            <UserAvatar
              user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile?.avatar_color, first_name: profile?.first_name, last_name: profile?.last_name }}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ cursor: "pointer" }} onClick={() => openRep()}>
            <div className="rc-ey">Rep Score · tap for details</div>
            <div className="rc-row">
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span className="rc-score">{repScore}</span>
                <span className="rc-pts">pts</span>
              </div>
              <div className="rc-badge" style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
                <Award size={10} /> {lvl.label}
              </div>
            </div>
            <div className="rc-track">
              <div className="rc-fill" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
            </div>
            <div className="rc-labels">
              {["New", "Reliable", "Trusted", "Legend"].map((l) => (
                <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>
                  {l}
                </span>
              ))}
            </div>
            <div className="rc-footer">
              {lvl.next ? (
                <>
                  +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +8 marking done · +10 as taker · +2 per post
                </>
              ) : (
                "Max level reached"
              )}
            </div>
          </div>
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
                onClick={() => openGig(g.id)}
              />
            ))
          )}
        </div>
        <div style={{ height: 16 }} />
      </div>

      {gigParam && (modalGig != null || gigModalPending) && (
        <GigDetailModal
          gig={modalGig}
          loading={gigModalPending && modalGig == null}
          tick={tick}
          requested={requested}
          currentUserId={currentUserId}
          onRequest={async () => {
            const result = await requestGig(gigParam);
            if (!result.error) {
              setRequested(true);
              queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
              queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
              return { error: null };
            }
            return result;
          }}
          onClose={closeGig}
          onViewProfile={(userId) =>
            navigate(`/profile/${userId}`, {
              state: {
                returnTo: `${location.pathname}?gig=${encodeURIComponent(gigParam)}`,
              },
            })
          }
          onGigDeleted={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
            queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
          }}
        />
      )}

      {repOpen && <RepDetailModal onClose={closeRep} />}
    </div>
  );
}
