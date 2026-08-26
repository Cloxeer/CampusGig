import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getAvatarUrl } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";
import { getLevel, useTimer } from "../utils/helpers";
import { useOpenGigsQuery, useCompletedGigsQuery } from "../hooks/useOpenGigsQuery";
import { useLegacyGigRedirect } from "../hooks/useLegacyGigRedirect";
import { getContext } from "../lib/spotMemory";
import { BrandLockup } from "../components/Logo";
import { RELEASE_STAGE, releaseStageLabel } from "../data/releaseStage";
import GigCard from "../components/GigCard";
import UserAvatar from "../components/UserAvatar";
import ProfileRepCard from "../features/profile/components/ProfileRepCard";
import AppSkeleton from "../components/AppSkeleton";
import SpotMascot from "../components/SpotMascot";
import {
  homeFeedTabs,
  HOME_TAB_RECENT,
  HOME_TAB_ALL,
  HOME_TAB_FINISHED,
  HOME_RECENT_MS,
} from "../data/categories";

const HOME_SPOT_CHAT = "home";
const HOME_SPOT_STAGE_CHAT = "home-stage";
const HOME_SPOT_WELCOME_CHAT = "home-welcome";
const HOME_SPOT_DELAY_MS = 3200;
const HOME_SPOT_STAGE_DELAY_MS = 3000;
const HOME_TABS_SCROLL_MS = 820;
const HOME_SPOT_POP_MS = 340;
const HOME_SPOT_SCRIPT = {
  intro: "Spot here — the name's Spot.",
  hints: ["Click to see finished gigs — get ideas of what to post or take."],
  closer: "I'll stick around.",
};
const HOME_SPOT_WELCOME_SCRIPT = {
  intro: "Spot here.",
  hints: ["What are you waiting for?", "Sign in or sign up!"],
  closer: "Go get 'em.",
};

function homeStageScript() {
  const stage = releaseStageLabel();
  return {
    intro: "Spot again.",
    hints: [`We're in ${stage}.`, "Stay on the lookout for the big launch."],
    closer: "I'll stick around.",
  };
}

function homeSpotStillOnScript() {
  const phase = getContext(HOME_SPOT_CHAT).phase;
  return phase === "script" || phase === "await-dismiss";
}

function homeSpotFinished() {
  const phase = getContext(HOME_SPOT_CHAT).phase;
  return phase === "resting" || phase === "done";
}

function homeStageSpotPending() {
  if (!RELEASE_STAGE) return false;
  const phase = getContext(HOME_SPOT_STAGE_CHAT).phase;
  return phase === "script" || phase === "await-dismiss";
}

function homeStageSpotFinished() {
  const phase = getContext(HOME_SPOT_STAGE_CHAT).phase;
  return phase === "resting" || phase === "done";
}

function homeWelcomeSpotPending() {
  const phase = getContext(HOME_SPOT_WELCOME_CHAT).phase;
  return phase === "script" || phase === "await-dismiss";
}

function homeWelcomeSpotFinished() {
  const phase = getContext(HOME_SPOT_WELCOME_CHAT).phase;
  return phase === "resting" || phase === "done";
}

function homeActFinished(act) {
  if (act === "stage") return homeStageSpotFinished();
  if (act === "welcome") return homeWelcomeSpotFinished();
  return homeSpotFinished();
}

/** Ease the tabs strip only — never scrollIntoView (that also jumps the page). */
function easeTabsToTab(tabsEl, tabEl, duration) {
  const max = Math.max(0, tabsEl.scrollWidth - tabsEl.clientWidth);
  if (max <= 1) return Promise.resolve();
  const centered = tabEl.offsetLeft - (tabsEl.clientWidth - tabEl.offsetWidth) / 2;
  const to = Math.max(0, Math.min(centered, max));
  const from = tabsEl.scrollLeft;
  if (Math.abs(to - from) < 2) return Promise.resolve();
  return new Promise((resolve) => {
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 * t - 2) ** 2 / 2);
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      tabsEl.scrollLeft = from + (to - from) * ease(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export default function Home({ currentUserId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(HOME_TAB_ALL);
  const didLandOnFeed = useRef(false);
  const tick = useTimer();

  const isAuthed = Boolean(currentUserId);
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const finishedTabRef = useRef(null);
  const logoRef = useRef(null);
  const stageRef = useRef(null);
  const welcomeRef = useRef(null);
  const [spotAct, setSpotAct] = useState("gigs");
  const [spotMounted, setSpotMounted] = useState(false);
  const [spotShow, setSpotShow] = useState(false);
  const spotWasShown = useRef(false);
  const spotStageDidRun = useRef(false);
  const [spotCorner, setSpotCorner] = useState({ top: "120px", left: "16px" });
  const [spotSize, setSpotSize] = useState(72);
  const [spotGaze, setSpotGaze] = useState(null);
  const [spotPlaceTick, setSpotPlaceTick] = useState(0);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
    enabled: isAuthed,
  });

  const { gigs, isPending: gigsPending } = useOpenGigsQuery();
  const { gigs: finishedGigs, isPending: finishedPending } = useCompletedGigsQuery();

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

  useEffect(() => {
    if (isAuthed) {
      setSpotShow(false);
      setSpotMounted(false);
      return undefined;
    }
    if (showFullSkeleton) return undefined;
    if (!homeSpotStillOnScript()) return undefined;
    let cancelled = false;
    let showTimer;
    const t0 = performance.now();
    const scrollAt = Math.max(0, HOME_SPOT_DELAY_MS - HOME_TABS_SCROLL_MS);
    const t = setTimeout(() => {
      requestAnimationFrame(() => {
        const tabEl = finishedTabRef.current;
        const tabsEl = tabsRef.current || tabEl?.parentElement;
        const run = tabsEl && tabEl
          ? easeTabsToTab(tabsEl, tabEl, HOME_TABS_SCROLL_MS)
          : Promise.resolve();
        run.then(() => {
          const rest = HOME_SPOT_DELAY_MS - (performance.now() - t0);
          const show = () => {
            if (!cancelled) {
              setSpotAct("gigs");
              setSpotMounted(true);
            }
          };
          if (rest > 16) showTimer = setTimeout(show, rest);
          else show();
        });
      });
    }, scrollAt);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearTimeout(showTimer);
    };
  }, [showFullSkeleton, isAuthed]);

  useLayoutEffect(() => {
    if (!spotMounted) return undefined;
    const id = requestAnimationFrame(() => setSpotShow(true));
    return () => cancelAnimationFrame(id);
  }, [spotMounted]);

  useEffect(() => {
    if (spotShow) spotWasShown.current = true;
  }, [spotShow]);

  useEffect(() => {
    if (spotShow || !spotMounted || !spotWasShown.current) return undefined;
    const t = setTimeout(() => setSpotMounted(false), HOME_SPOT_POP_MS);
    return () => clearTimeout(t);
  }, [spotShow, spotMounted]);

  useEffect(() => {
    if (isAuthed || showFullSkeleton || !RELEASE_STAGE) return undefined;
    if (spotMounted || spotShow) return undefined;
    if (!homeSpotFinished() || !homeStageSpotPending()) return undefined;
    const t = setTimeout(() => {
      spotWasShown.current = false;
      spotStageDidRun.current = true;
      setSpotAct("stage");
      setSpotMounted(true);
    }, HOME_SPOT_STAGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAuthed, showFullSkeleton, spotMounted, spotShow]);

  useEffect(() => {
    if (isAuthed || showFullSkeleton) return undefined;
    if (spotMounted || spotShow) return undefined;
    if (!spotStageDidRun.current) return undefined;
    if (!homeStageSpotFinished() || !homeWelcomeSpotPending()) return undefined;
    const t = setTimeout(() => {
      spotWasShown.current = false;
      setSpotAct("welcome");
      setSpotMounted(true);
    }, HOME_SPOT_STAGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAuthed, showFullSkeleton, spotMounted, spotShow]);

  const repScore = profile?.rep_score || 0;
  const lvl = getLevel(repScore);

  const activeGigs = gigs.filter((g) => {
    if (!g.deadline) return true;
    return g.deadline > Date.now();
  });

  const recentCutoff = Date.now() - HOME_RECENT_MS;
  const recentGigs = activeGigs.filter((g) => g.postedAt >= recentCutoff);
  const includeRecent = recentGigs.length > 0;
  const tabs = homeFeedTabs(includeRecent);

  useEffect(() => {
    if (gigsPending) return;
    if (!didLandOnFeed.current) {
      didLandOnFeed.current = true;
      if (!spotShow) setTab(includeRecent ? HOME_TAB_RECENT : HOME_TAB_ALL);
      return;
    }
    if (!includeRecent && tab === HOME_TAB_RECENT) setTab(HOME_TAB_ALL);
  }, [gigsPending, includeRecent, tab, spotShow]);

  const isFinishedTab = tab === HOME_TAB_FINISHED;

  const filteredGigs = useMemo(() => {
    if (tab === HOME_TAB_FINISHED) return finishedGigs;
    if (tab === HOME_TAB_RECENT) return recentGigs;
    if (tab === HOME_TAB_ALL) return activeGigs;
    return activeGigs.filter((g) => g.cat === tab);
  }, [tab, finishedGigs, recentGigs, activeGigs]);

  const listPending = isFinishedTab ? finishedPending : gigsPending;
  const countLabel = isFinishedTab
    ? `${filteredGigs.length} finished example${filteredGigs.length !== 1 ? "s" : ""}`
    : `${filteredGigs.length} open gig${filteredGigs.length !== 1 ? "s" : ""}`;
  const emptyLabel = isFinishedTab
    ? "No finished gigs yet — completed jobs will show here as examples."
    : "No gigs yet — be the first to post one!";

  useEffect(() => {
    if (!spotShow) return undefined;
    const t = setTimeout(() => setSpotPlaceTick((n) => n + 1), 80);
    return () => clearTimeout(t);
  }, [spotShow]);

  useLayoutEffect(() => {
    if (showFullSkeleton) return undefined;
    const place = () => {
      const desktop = window.matchMedia("(min-width: 900px)").matches;
      if (spotAct === "stage") {
        const lockup = document.querySelector(".topbar .tlogo") || logoRef.current;
        const stage =
          document.querySelector(".topbar .logo-stage") ||
          lockup?.querySelector(".logo-stage") ||
          stageRef.current;
        const bar = document.querySelector(".topbar");
        if (!lockup || !bar) return;
        const lr = lockup.getBoundingClientRect();
        const br = bar.getBoundingClientRect();
        const sr = stage ? stage.getBoundingClientRect() : lr;
        const size = desktop ? 46 : 50;
        setSpotSize(size);
        setSpotCorner({
          top: `${Math.round(br.top + (br.height - size) / 2)}px`,
          left: `${Math.round(lr.right + 20)}px`,
        });
        setSpotGaze({
          x: sr.left + sr.width / 2,
          y: sr.top + sr.height / 2,
        });
        return;
      }
      if (spotAct === "welcome") {
        const btn = welcomeRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const size = desktop ? 46 : 50;
        setSpotSize(size);
        const left = Math.max(8, r.left - size - 8);
        setSpotCorner({
          top: `${Math.round(r.top + (r.height - size) / 2)}px`,
          left: `${Math.round(left)}px`,
        });
        setSpotGaze({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        });
        return;
      }
      const tab = finishedTabRef.current;
      if (!tab) return;
      const r = tab.getBoundingClientRect();
      const size = desktop ? 68 : 76;
      setSpotSize(size);
      const gap = 8;
      let left;
      if (desktop) {
        left = r.right + gap;
      } else {
        left = r.left - size - gap;
        if (left < 8) left = r.right + gap;
      }
      left = Math.max(8, Math.min(left, window.innerWidth - size - 12));
      setSpotCorner({
        top: `${Math.round(r.top + (r.height - size) / 2)}px`,
        left: `${Math.round(left)}px`,
      });
      setSpotGaze({
        x: r.left + r.width * 0.55,
        y: r.top + r.height * 0.5,
      });
    };
    place();
    const tabsEl = finishedTabRef.current?.parentElement;
    const scrollEl = scrollRef.current;
    window.addEventListener("resize", place);
    scrollEl?.addEventListener("scroll", place, { passive: true });
    tabsEl?.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      scrollEl?.removeEventListener("scroll", place);
      tabsEl?.removeEventListener("scroll", place);
    };
  }, [showFullSkeleton, includeRecent, spotShow, spotAct, filteredGigs.length, spotPlaceTick]);

  if (showFullSkeleton) return <AppSkeleton />;

  return (
    <div className="page fadein">
      <div className="topbar">
        <BrandLockup lockupRef={logoRef} stageRef={stageRef} />
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
            <button
              ref={welcomeRef}
              className="btn bp"
              style={{ fontSize: 13, padding: "6px 14px" }}
              onClick={() => navigate("/welcome")}
            >
              Welcome
            </button>
          )}
        </div>
      </div>

      {!isAuthed && spotMounted ? (
        <SpotMascot
          key={`home-spot-${spotAct}`}
          className={`home-spot home-spot--${spotAct}`}
          float
          show={spotShow}
          size={spotSize}
          mood={spotAct === "stage" ? "excited" : "attentive"}
          flip={spotAct === "stage"}
          corner={spotCorner}
          lookAt={spotGaze || "cursor"}
          lookAtRef={spotAct === "stage" ? stageRef : spotAct === "welcome" ? welcomeRef : null}
          script={
            spotAct === "stage"
              ? homeStageScript()
              : spotAct === "welcome"
                ? HOME_SPOT_WELCOME_SCRIPT
                : HOME_SPOT_SCRIPT
          }
          chatId={
            spotAct === "stage"
              ? HOME_SPOT_STAGE_CHAT
              : spotAct === "welcome"
                ? HOME_SPOT_WELCOME_CHAT
                : HOME_SPOT_CHAT
          }
          autoSpeak
          autoAdvanceMs={HOME_SPOT_DELAY_MS}
          bubbleSide={spotAct === "gigs" ? "top" : "bottom"}
          onBubbleChange={(open) => {
            if (!open && homeActFinished(spotAct)) setSpotShow(false);
          }}
          onClick={() => {
            if (spotAct === "gigs") {
              setTab(HOME_TAB_FINISHED);
              const tabsEl = tabsRef.current;
              const tabEl = finishedTabRef.current;
              if (tabsEl && tabEl) easeTabsToTab(tabsEl, tabEl, HOME_TABS_SCROLL_MS);
            }
            if (homeActFinished(spotAct)) setSpotShow(false);
          }}
        />
      ) : null}

      <div ref={scrollRef} className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ margin: "14px 16px 0" }}>
          <ProfileRepCard
            variant={isAuthed ? "self" : "guest"}
            repScore={repScore}
            lvl={lvl}
            onRepPath={() => navigate("/profile/rep", { state: { returnTo: "/" } })}
          />
        </div>

        <div style={{ padding: "0 16px" }}>
          <div ref={tabsRef} className="tabs" style={{ margin: "14px -16px 0", padding: "0 16px" }}>
            {tabs.map((t) => (
              <button
                key={t}
                ref={t === HOME_TAB_FINISHED ? finishedTabRef : undefined}
                className={`tab ${tab === t ? "on" : ""}`}
                onClick={(e) => {
                  setTab(t);
                  const tabsEl = tabsRef.current;
                  if (tabsEl) easeTabsToTab(tabsEl, e.currentTarget, HOME_TABS_SCROLL_MS);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-.01em" }}>
            {countLabel}
          </span>
        </div>

        <div className="gig-grid" style={{ padding: "0 16px" }}>
          {listPending ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
              ))}
            </>
          ) : filteredGigs.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
              {emptyLabel}
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
