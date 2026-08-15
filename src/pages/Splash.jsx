import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Search, Handshake, Star, ArrowLeft, ArrowRight, LogIn, Briefcase, Users, CheckCircle } from "lucide-react";
import Logo, { LogoMark } from "../components/Logo";
import { getPublicStats, getCachedPublicStats, subscribePublicStats } from "../lib/profile";
import { useCountUp } from "../hooks/useCountUp";

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
  /* Instant paint from last-known numbers; then a fresh read + a live
     subscription so open pages tick in real time as gigs/accounts land. */
  const [stats, setStats] = useState(
    () => getCachedPublicStats() || { totalPostings: 0, completed: 0, accounts: 0 }
  );
  /* Staggered odometer sweeps — each stat lands a beat after the previous.
     Live updates sweep from the current value, not from zero. */
  const totalPostings = useCountUp(stats.totalPostings, { delay: 120 });
  const completed = useCountUp(stats.completed, { delay: 260 });
  const accounts = useCountUp(stats.accounts, { delay: 400 });

  useEffect(() => {
    let alive = true;
    getPublicStats().then((v) => {
      if (alive) setStats(v);
    });
    const unsubscribe = subscribePublicStats((v) => {
      if (alive) setStats(v);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 44 }}>
            <LogoMark size={32} style={{ borderRadius: "var(--r)" }} />
            <Logo size={17} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div className="sdot" />
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--fg3)" }}>
              student-to-student · Main Campus @nmsu.edu
            </span>
          </div>

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
            Small tasks.
            <br />
            Real <span style={{ color: "var(--green)" }}>money.</span>
          </div>

          <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.65, maxWidth: 280 }}>
            Post an errand. Pick one up. Build your campus reputation.
          </p>

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
            Las Cruces Main Campus @nmsu.edu only · GO aggies
          </span>
        </div>
      </div>
    </div>
  );
}
