import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Search, Handshake, Star, ArrowLeft, ArrowRight, LogIn, Briefcase, Users, CheckCircle } from "lucide-react";
import Logo, { LogoMark } from "../components/Logo";
import { getPublicStats, subscribePublicStats, PUBLIC_STATS_EMPTY } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";
import { useCountUp } from "../hooks/useCountUp";

/* Rotating hero headlines — a "rolling log" that swaps between the two sides of
   the marketplace: earn (do gigs) and hire (post gigs). Each message is two
   headline lines (one green accent) plus a subline. Keep lines short so they
   never wrap at 38px. */
const HERO_MESSAGES = [
  {
    line1: "Small tasks.",
    line2: ["Real ", { g: "money." }],
    sub: "Post it or pick it up — and build your campus rep.",
  },
  {
    line1: "Need it done?",
    line2: [{ g: "Hire a student." }],
    sub: "Post any job. A verified NMSU student makes it happen.",
  },
  {
    line1: "Your skills.",
    line2: ["Real ", { g: "pay." }],
    sub: "Design, code, tutor, run errands — get paid to do it.",
  },
];

/* One hero message (headline + subline). `phase` drives the crossfade:
   "in" settles into place, "out" softly blurs and drifts up. Both are stacked
   in the same reserved box so they overlap during the transition. */
function HeroMessage({ msg, phase }) {
  return (
    <div className={`hero-roll__item hero-roll__item--${phase}`}>
      <div
        style={{
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: "-.045em",
          lineHeight: 1.05,
          color: "var(--fg)",
          marginBottom: 14,
        }}
      >
        {msg.line1}
        <br />
        {msg.line2.map((seg, i) =>
          typeof seg === "string" ? (
            seg
          ) : (
            <span key={i} style={{ color: "var(--green)" }}>
              {seg.g}
            </span>
          )
        )}
      </div>
      <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.65, maxWidth: 280 }}>
        {msg.sub}
      </p>
    </div>
  );
}

const SLIDES = [
  {
    icon: <Search size={28} />,
    title: "Browse open gigs",
    body: "See tasks and jobs posted across campus — by local clients and fellow students alike.",
  },
  {
    icon: <Handshake size={28} />,
    title: "Post work, or take it on",
    body: "Anyone can post a task. Verified NMSU students pick it up and get it done — on their own schedule.",
  },
  {
    icon: <Star size={28} />,
    title: "Build your reputation",
    body: "Finish jobs, earn rep, and climb the leaderboard. Your campus reputation follows you.",
  },
];

export default function Splash() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [slide, setSlide] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPrev, setHeroPrev] = useState(null);

  /* Cycle the hero headline every few seconds (the "rolling log"). We keep the
     outgoing message mounted for one beat so the two crossfade — the old one
     softly blurs + drifts up as the new one settles in. */
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIdx((i) => {
        setHeroPrev(i);
        return (i + 1) % HERO_MESSAGES.length;
      });
    }, 4200);
    return () => clearInterval(id);
  }, []);
  const queryClient = useQueryClient();
  /* Shared React Query cache: instant paint from the persisted last-known value,
     then a background revalidate. staleTime 0 so a fresh read fires on mount. */
  const { data: stats = PUBLIC_STATS_EMPTY } = useQuery({
    queryKey: queryKeys.publicStats,
    queryFn: getPublicStats,
    staleTime: 0,
  });
  /* Staggered odometer sweeps — each stat lands a beat after the previous.
     Live updates sweep from the current value, not from zero. */
  const totalPostings = useCountUp(stats.totalPostings, { delay: 120 });
  const completed = useCountUp(stats.completed, { delay: 260 });
  const accounts = useCountUp(stats.accounts, { delay: 400 });

  /* Live subscription writes straight into the shared cache so the odometers
     tick in real time as gigs/accounts land. */
  useEffect(() => {
    const unsubscribe = subscribePublicStats((v) => {
      queryClient.setQueryData(queryKeys.publicStats, v);
    });
    return unsubscribe;
  }, [queryClient]);

  if (showTutorial) {
    const s = SLIDES[slide];
    const isLast = slide === SLIDES.length - 1;

    return (
      <div className="splash fadein">
        <div className="splash-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="sfade" />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}>
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
              {s.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.03em", color: "var(--fg)", marginBottom: 10, lineHeight: 1.2 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.65, maxWidth: 280 }}>
              {s.body}
            </div>
          </div>
        </div>

        <div className="sfoot">
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {SLIDES.map((_, i) => (
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

          {isLast ? (
            <button className="btn bp bfull blg" onClick={() => navigate("/auth?mode=signup")}>
              <LogIn size={16} /> Create account
            </button>
          ) : (
            <button className="btn bp bfull blg" onClick={() => setSlide(slide + 1)}>
              Continue <ArrowRight size={16} />
            </button>
          )}
          <button
            className="btn bg-btn bfull"
            style={{ color: "var(--fg3)", fontSize: 13 }}
            onClick={() => {
              if (slide > 0) setSlide(slide - 1);
              else setShowTutorial(false);
            }}
          >
            <ArrowLeft size={13} /> {slide > 0 ? "Back" : "Back to welcome"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="splash fadein">
      <div className="splash-body">
        <button
          type="button"
          className="btn bg-btn bico"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}
        >
          <ArrowLeft size={15} />
        </button>
        <div className="sgrid" />
        <div className="sfade" />
        <div className="scontent shell-prose">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <LogoMark size={32} style={{ borderRadius: "var(--r)" }} />
            <Logo size={17} />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--mono)",
              letterSpacing: ".02em",
              color: "var(--fg3)",
              marginBottom: 44,
            }}
          >
            Connect. <span style={{ color: "var(--green)" }}>Earn.</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div className="sdot" />
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--fg3)" }}>
              post it or pick it up · NMSU Las Cruces
            </span>
          </div>

          <div className="hero-roll">
            {heroPrev !== null && heroPrev !== heroIdx && (
              <HeroMessage key={`out-${heroPrev}`} msg={HERO_MESSAGES[heroPrev]} phase="out" />
            )}
            <HeroMessage key={`in-${heroIdx}`} msg={HERO_MESSAGES[heroIdx]} phase="in" />
          </div>

          <div className="splash-stats">
            <div className="splash-stat">
              <Briefcase size={14} color="var(--fg3)" />
              <span className="splash-stat-val">{totalPostings}</span>
              <span className="splash-stat-lbl">Total postings</span>
            </div>
            <div className="splash-stat">
              <CheckCircle size={14} color="var(--green-d)" />
              <span className="splash-stat-val">{completed}</span>
              <span className="splash-stat-lbl">Completed</span>
            </div>
            <div className="splash-stat">
              <Users size={14} color="var(--fg3)" />
              <span className="splash-stat-val">{accounts}</span>
              <span className="splash-stat-lbl">Accounts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sfoot">
        <button className="btn bo bfull" onClick={() => setShowTutorial(true)}>
          How it works
        </button>
        <button
          className="btn bp bfull blg"
          onClick={() => navigate("/auth?mode=signup")}
        >
          Get started
        </button>
        <button className="btn bo bfull blg" onClick={() => navigate("/auth")}>
          Sign in
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 2 }}>
          <Lock size={11} color="var(--fg4)" />
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--fg4)" }}>
            Anyone can post · only verified NMSU students work gigs · GO aggies
          </span>
        </div>
      </div>
    </div>
  );
}
