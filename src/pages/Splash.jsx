import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { navigateBack } from "../utils/navBack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Send, GraduationCap, Banknote, ShieldCheck, ArrowLeft, ArrowRight, LogIn, Briefcase, Users, CheckCircle, User } from "lucide-react";
import { BrandLockup } from "../components/Logo";
import CosmeticRing from "../components/CosmeticRing";
import { TagBadge } from "../components/EquippedTagBadge";
import { COSMETICS } from "../data/cosmetics";
import { getPublicStats, subscribePublicStats, PUBLIC_STATS_EMPTY } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";
import { useCountUp } from "../hooks/useCountUp";
import SpotMascot from "../components/SpotMascot";
import LiveStatusDot from "../components/LiveStatusDot";
import spotIdleCycle from "../assets/spot/spot-idle-cycle.mp4";

/* The real cosmetics catalog, split once — the rotating showcase on the last
   tutorial slide previews these on a placeholder pfp. */
const SHOWCASE_BORDERS = COSMETICS.filter((c) => c.type === "border");
const SHOWCASE_TAGS = COSMETICS.filter((c) => c.type === "tag");

/* Pick a random cosmetic that is NOT the previous one and NOT the previous
   rarity — so the showcase never repeats and always alternates rarity (no run
   of commons). Different rarity guarantees a different item. */
function pickNext(list, prev) {
  const pool = prev ? list.filter((c) => c.rarity !== prev.rarity) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* One frame of the showcase: a temporary pfp inside a real border, with the
   real tag below — the SAME CosmeticRing + TagBadge the Inventory uses. */
function CosmeticFrame({ border, tag }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <CosmeticRing cosmetic={border} size={60}>
        <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", background: "var(--bg3)", color: "var(--fg3)" }}>
          <User size={26} />
        </span>
      </CosmeticRing>
      <TagBadge cosmetic={tag} />
    </span>
  );
}

/* Live, rotating preview of the borders + tags we offer — randomized, never the
   same (or same rarity) twice, crossfading smoothly between frames. */
function CosmeticShowcase() {
  const [s, setS] = useState(() => ({
    border: pickNext(SHOWCASE_BORDERS, null),
    tag: pickNext(SHOWCASE_TAGS, null),
    prev: null,
    n: 0,
  }));
  useEffect(() => {
    const id = setInterval(() => {
      setS((cur) => ({
        border: pickNext(SHOWCASE_BORDERS, cur.border),
        tag: pickNext(SHOWCASE_TAGS, cur.tag),
        prev: { border: cur.border, tag: cur.tag },
        n: cur.n + 1,
      }));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: "relative", display: "grid", placeItems: "center", height: 96, marginBottom: 24 }}>
      {/* Outgoing frame eases out while the incoming eases in — stacked in one cell. */}
      {s.prev ? (
        <span key={`p${s.n}`} style={{ gridArea: "1 / 1", animation: "cosmOut .55s ease forwards", pointerEvents: "none" }}>
          <CosmeticFrame border={s.prev.border} tag={s.prev.tag} />
        </span>
      ) : null}
      <span key={`c${s.n}`} style={{ gridArea: "1 / 1", animation: "cosmIn .55s ease" }}>
        <CosmeticFrame border={s.border} tag={s.tag} />
      </span>
    </div>
  );
}

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
    <div className={`txt-roll__item txt-roll__item--${phase}`}>
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
    icon: <Send size={28} />,
    title: "Post a job",
    body: "Post a job and set the price. Outside clients' posts reach the whole world; posts from NMSU students stay between verified students — one platform, filtered by audience.",
  },
  {
    icon: <GraduationCap size={28} />,
    title: "A verified student does it",
    body: "Verified NMSU students browse and pick the gigs they want, and get them done on their own schedule. Students can both post and take gigs — outside clients can only post, never take them.",
  },
  {
    icon: <Banknote size={28} />,
    title: "Pay directly",
    body: "When it's finished, you pay the student directly — Venmo, Cash App, PayPal, or Zelle. GetCampusGig never touches the money.",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Reviews keep it safe",
    body: "Check someone's reviews before you deal, and steer clear of bad ones. Agree on the price up front and stay vigilant on both sides — whether you're paying or getting paid — since money is direct between you two. Always leave a review after; it builds everyone's rep.",
  },
  {
    showcase: true,
    title: "Earn rep & prizes",
    body: "Every finished gig earns rep and climbs you up the leaderboard — and unlocks cosmetic prizes for your profile.",
  },
];

/* Spot "acts out" each tutorial slide: a mood + a spot in the layout, right next
   to that slide's info. He sits IN the page (not pinned to the screen) and looks
   at the section as if reading it himself. `pos` is anchored to the content
   column's centre with calc(), so it holds regardless of the column width.
   Order matches SLIDES above. */
/* `flip` mirrors Spot so his eyes face the content: he faces RIGHT by default
   (eyes sit upper-right), so flip him only when he's placed to the RIGHT of the
   column and needs to look left. */
const SPOT_SLIDES = [
  // Post a job — left of icon. Click him → he intros once, then walks this
  // slide's points, wraps up, and rests (pester 5× or reload for bonus lines).
  {
    mood: "attentive",
    flip: false,
    pos: { top: -8, right: "calc(50% + 34px)" },
    bubbleSide: "top",
    chatId: "hiw-post",
    script: {
      intro: "Spot here — the name's Spot.",
      hints: ["Post any job. Set the price.", "The whole world can see it."],
      closer: "I live here. I'll help.",
    },
  },
  // A verified student does it — right of icon, facing the title.
  {
    mood: "excited",
    flip: true,
    pos: { top: -8, left: "calc(50% + 34px)" },
    bubbleSide: "top",
    chatId: "hiw-student",
    script: {
      intro: "Oh hey — I'm Spot.",
      hints: ["Real students, all verified.", "They pick it up, they do it.", "Students can post too."],
    },
  },
  // Pay directly — below text, left.
  {
    mood: "neutral",
    flip: false,
    pos: { top: 250, right: "calc(50% + 30px)" },
    bubbleSide: "bottom",
    chatId: "hiw-pay",
    script: {
      intro: "It's Spot.",
      hints: ["You pay each other, direct.", "Venmo, Zelle, Cash App.", "We never touch the money."],
    },
  },
  // Reviews — right of icon.
  {
    mood: "suspicious",
    flip: true,
    pos: { top: -8, left: "calc(50% + 34px)" },
    bubbleSide: "top",
    chatId: "hiw-reviews",
    script: {
      intro: "Spot, watching your back.",
      hints: ["Read reviews before you deal.", "Skip the sketchy ones.", "Always leave one after."],
      closer: "Be fair out there.",
    },
  },
  // Earn rep & prizes — above showcase (awe).
  {
    mood: "surprised",
    flip: false,
    pos: { top: -84, left: "calc(50% - 34px)" },
    bubbleSide: "top",
    chatId: "hiw-rep",
    script: {
      intro: "Last bit from Spot.",
      hints: ["Finish gigs, earn rep.", "Climb the leaderboard.", "Unlock cool cosmetics."],
      closer: "That's the tour.",
    },
  },
];

function clampHowItWorksStep(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > SLIDES.length) return SLIDES.length;
  return n;
}

export default function Splash() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHowItWorks = location.pathname === "/welcome/how-it-works";
  const step = clampHowItWorksStep(searchParams.get("step"));
  const slide = step - 1;

  useEffect(() => {
    if (!isHowItWorks) return;
    if (searchParams.get("step") === String(step)) return;
    const next = new URLSearchParams(searchParams);
    next.set("step", String(step));
    setSearchParams(next, { replace: true });
  }, [isHowItWorks, searchParams, setSearchParams, step]);

  const spotTarget = useRef(null);

  /* Spot pops OUT, jumps to the new slide's spot while invisible, then pops
     back IN — so he never slides across the text between pages. */
  const [spotSlide, setSpotSlide] = useState(0);
  const [spotShow, setSpotShow] = useState(true);
  useEffect(() => {
    if (slide === spotSlide) return undefined;
    setSpotShow(false); // pop out at the old position
    const t = setTimeout(() => {
      setSpotSlide(slide); // move + change mood/flip while hidden
      setSpotShow(true); // pop back in at the new position
    }, 230);
    return () => clearTimeout(t);
  }, [slide, spotSlide]);
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

  if (isHowItWorks) {
    const s = SLIDES[slide];
    const isLast = slide === SLIDES.length - 1;

    return (
      <div className="splash fadein">
        <div className="splash-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="sfade" />
          <div ref={spotTarget} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 20px" }}>
            {/* Spot sits right beside this slide's info (in the page, not pinned
                to the screen) and watches it — new mood + spot each slide. */}
            <SpotMascot
              key="tour-spot"
              float={false}
              show={spotShow}
              size={78}
              mood={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).mood}
              flip={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).flip}
              rotate={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).rotate || 0}
              videoSrc={spotSlide === 0 ? spotIdleCycle : null}
              script={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).script}
              chatId={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).chatId}
              bubbleSide={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).bubbleSide || "top"}
              style={(SPOT_SLIDES[spotSlide] || SPOT_SLIDES[0]).pos}
              lookAtRef={spotTarget}
            />
            {s.showcase ? (
              <CosmeticShowcase />
            ) : (
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
            )}
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
            <button
              className="btn bp bfull blg"
              onClick={() => navigate(`/welcome/how-it-works?step=${step + 1}`)}
            >
              Continue <ArrowRight size={16} />
            </button>
          )}
          <button
            className="btn bg-btn bfull"
            style={{ color: "var(--fg3)", fontSize: 13 }}
            onClick={() => {
              if (step > 1) navigateBack(navigate, `/welcome/how-it-works?step=${step - 1}`);
              else navigateBack(navigate, "/welcome");
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
          className="btn bg-btn bico splash-back"
          onClick={() => navigate("/")}
          aria-label="Back to home"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="sgrid" />
        <div className="sfade" />
        <div className="scontent shell-prose">
          <BrandLockup
            className="splash-brand"
            logoSize={22}
            markStyle={{ borderRadius: "var(--r)" }}
          />

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
            Connect. <span style={{ color: "var(--green)" }}>Earn.</span> Repeat.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <LiveStatusDot />
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--fg3)" }}>
              post it or pick it up · NMSU Las Cruces
            </span>
          </div>

          <div className="txt-roll txt-roll--hero">
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
        <button className="btn bo bfull" onClick={() => navigate("/welcome/how-it-works?step=1")}>
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
        <div className="sfoot-note">
          <p className="sfoot-policy">
            <Lock size={11} color="var(--fg4)" aria-hidden />
            <span className="sfoot-note-copy">
              Anyone can post · only verified NMSU students work gigs
            </span>
          </p>
          <p className="sfoot-go">
            <span>
              GO <span className="sfoot-aggies">Aggies</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
