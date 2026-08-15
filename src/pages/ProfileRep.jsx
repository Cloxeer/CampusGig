import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Lenis from "lenis";
import { ArrowLeft, Plus, Check, Star, Award, Trophy, Lock, Crown, GraduationCap, ChevronDown } from "lucide-react";
import { getMyProfile, getCampusRank, getAvatarUrl } from "../lib/profile";
import UserAvatar from "../components/UserAvatar";
import { queryKeys } from "../lib/queryClient";
import { getLevel } from "../utils/helpers";
import { safeAppReturnTo } from "../hooks/useModalParam";
import { buildRepPathSections, REP_PATH_EARN_ROWS } from "../utils/repPathModel";
import "./repPath.css";

const ICONS = {
  plus: Plus,
  check: Check,
  star: Star,
  award: Award,
  trophy: Trophy,
  lock: Lock,
  crown: Crown,
};

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function cubicPointAt(start, c1, c2, end, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * start.x + 3 * uu * t * c1.x + 3 * u * tt * c2.x + ttt * end.x,
    y: uuu * start.y + 3 * uu * t * c1.y + 3 * u * tt * c2.y + ttt * end.y,
  };
}

function buildConnectorGeometry(from, to, colWidth = null) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;

  const start = { x: from.x + ux * from.r, y: from.y + uy * from.r };
  const end = { x: to.x - ux * to.r, y: to.y - uy * to.r };

  const midX = (start.x + end.x) / 2;
  const edgeBias =
    colWidth && Number.isFinite(colWidth) && colWidth > 40
      ? Math.sign(midX - colWidth / 2) * Math.min(26, colWidth * 0.065)
      : 0;

  const c1 = {
    x: start.x + (end.x - start.x) * 0.22 + edgeBias,
    y: start.y + Math.max(34, Math.abs(end.y - start.y) * 0.46),
  };
  const c2 = {
    x: start.x + (end.x - start.x) * 0.78 + edgeBias,
    y: end.y - Math.max(34, Math.abs(end.y - start.y) * 0.46),
  };

  const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;

  return { start, c1, c2, end, d };
}

function segmentProgress(score, fromTarget, toTarget) {
  if (!Number.isFinite(fromTarget) || !Number.isFinite(toTarget) || toTarget <= fromTarget) {
    return score >= toTarget ? 1 : 0;
  }
  if (score <= fromTarget) return 0;
  if (score >= toTarget) return 1;
  return clamp01((score - fromTarget) / (toTarget - fromTarget));
}

function PathStep({ node, nodeRef }) {
  const isMilestone = node.kind === "milestone";
  const isCheckpoint = node.kind === "checkpoint";
  const MilestoneIcon = isMilestone ? ICONS[node.icon] || Crown : Award;

  let nodeClass = "rep-path-node";
  if (isMilestone) nodeClass += " rep-path-node--milestone";
  if (node.locked) nodeClass += " rep-path-node--locked";
  else if (node.done) nodeClass += " rep-path-node--done";
  else if (node.active) nodeClass += " rep-path-node--active";
  else nodeClass += " rep-path-node--next";
  if (isMilestone && node.variant) nodeClass += ` rep-path-ms--${node.variant}`;

  const subline = node.subtitle || "";
  const reached =
    isMilestone && node.done
      ? {
          reliable: "Reached · Reliable",
          trusted: "Reached · Trusted",
          champ: "Legend — you made it",
        }[node.variant] || "Tier unlocked"
      : null;

  const ariaLabel = `${isCheckpoint ? `Goal ${node.targetRep} rep` : node.title}${node.done ? ", completed" : node.locked ? ", locked" : node.active ? ", your current goal" : ", next goal"}`;

  return (
    <div className={`rep-path-step-wrapper rep-path-step-wrapper--${node.row}`}>
      <div className={`rep-path-step rep-path-step--${node.row}`}>
        <div className="rep-path-node-wrap" ref={nodeRef}>
          {node.active && !node.locked ? <div className="rep-path-pulse" aria-hidden /> : null}
          <div
            className={nodeClass}
            role="img"
            aria-label={ariaLabel}
          >
            {isCheckpoint ? (
              node.locked ? (
                <Lock size={22} strokeWidth={2.2} aria-hidden />
              ) : (
                <span className="rep-path-node__num">{node.targetRep}</span>
              )
            ) : node.locked ? (
              <Lock size={isMilestone ? 26 : 22} strokeWidth={2.2} aria-hidden />
            ) : (
              <MilestoneIcon size={isMilestone ? 26 : 22} strokeWidth={2.2} color="currentColor" aria-hidden />
            )}
          </div>
        </div>
      </div>
      <div className="rep-path-step-copy">
        <div className="rep-path-step-title">{node.title}</div>
        {subline ? <div className="rep-path-step-sub">{subline}</div> : null}
        {reached ? (
          <div className={`rep-path-milestone-reached rep-path-milestone-reached--${node.variant || "reliable"}`}>{reached}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function ProfileRep() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sectionConnectors, setSectionConnectors] = useState({});
  const [markerHintSectionId, setMarkerHintSectionId] = useState(null);
  /** Climb-up additions: draw-in animation + floating return chip while climbing. */
  const [drawn, setDrawn] = useState(false);
  const [showChip, setShowChip] = useState(false);
  const sectionRefs = useRef(new Map());
  const nodeRefs = useRef(new Map());
  const scrollRef = useRef(null);
  const infoRef = useRef(null);
  const didAutoScrollRef = useRef(false);

  useEffect(() => {
    function onDocPointerDown(e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest(".rep-path-marker-hit") || t.closest(".rep-path-marker-hint")) return;
      setMarkerHintSectionId(null);
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  const { data: profileData, isPending: profilePending } = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: getMyProfile,
  });

  const profile = profileData?.profile ?? null;
  const isGuest = !profile;
  const repScore = profile?.rep_score ?? 0;
  /** True once the main view (not the skeleton) is mounted — effects that touch the
      path DOM must key on this: for guests `sections` never changes identity, so
      deps of [sections] alone would leave them stuck against the skeleton DOM. */
  const pageReady = !(profilePending && !profile);

  const { data: rankData } = useQuery({
    queryKey: ["campusRank", repScore],
    queryFn: () => getCampusRank(repScore),
    enabled: !!profile,
  });

  const sections = useMemo(() => buildRepPathSections({ score: repScore }), [repScore]);
  /** Visual climb-up order: Legend at the top (the summit), first steps at the bottom. */
  const climbSections = useMemo(() => sections.slice().reverse(), [sections]);

  useLayoutEffect(() => {
    function recomputeConnectors() {
      const next = {};
      /* Global draw order along the climb: counts from the path start (bottom) upward. */
      let seqCounter = 0;

      for (const sec of sections) {
        const colEl = sectionRefs.current.get(sec.id);
        if (!colEl) continue;

        const colRect = colEl.getBoundingClientRect();
        const nodes = [];

        for (const node of sec.nodes) {
          const key = `${sec.id}::${node.id}`;
          const wrap = nodeRefs.current.get(key);
          const circle = wrap?.querySelector(".rep-path-node");
          if (!circle) continue;

          const rect = circle.getBoundingClientRect();
          nodes.push({
            ...node,
            x: rect.left - colRect.left + rect.width / 2,
            y: rect.top - colRect.top + rect.height / 2,
            r: rect.width / 2,
          });
        }

        const paths = [];
        let progressMarker = null;
        /** Furthest segment endpoint reached along the path (when moving between checkpoints). */
        let fallbackEndpoint = null;

        for (let i = 1; i < nodes.length; i += 1) {
          const prev = nodes[i - 1];
          const curr = nodes[i];
          const fromTarget = Number(prev.targetRep ?? 0);
          const toTarget = Number(curr.targetRep ?? fromTarget + 1);
          const progress = segmentProgress(repScore, fromTarget, toTarget);
          const geometry = buildConnectorGeometry(prev, curr, colEl.clientWidth);

          paths.push({
            id: `${prev.id}->${curr.id}`,
            d: geometry.d,
            progress,
            seq: seqCounter++,
          });

          if (!progressMarker && progress > 0 && progress < 1) {
            const markerPoint = cubicPointAt(geometry.start, geometry.c1, geometry.c2, geometry.end, progress);
            progressMarker = { x: markerPoint.x, y: markerPoint.y };
          }

          if (progress >= 1) {
            fallbackEndpoint = { x: geometry.end.x, y: geometry.end.y };
          }
        }

        if (!progressMarker && fallbackEndpoint) {
          progressMarker = fallbackEndpoint;
        }
        if (!progressMarker && nodes.length > 0) {
          progressMarker = { x: nodes[0].x, y: nodes[0].y };
        }

        if (!sec.unlocked) {
          progressMarker = null;
        }

        next[sec.id] = {
          width: Math.max(1, colEl.clientWidth),
          height: Math.max(1, colEl.scrollHeight),
          paths,
          progressMarker,
        };
      }

      setSectionConnectors(next);
    }

    const raf = requestAnimationFrame(recomputeConnectors);
    const observers = [];

    for (const sec of sections) {
      const colEl = sectionRefs.current.get(sec.id);
      if (!colEl) continue;
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(recomputeConnectors);
      });
      ro.observe(colEl);
      observers.push(ro);
    }

    window.addEventListener("resize", recomputeConnectors);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(recomputeConnectors));
    }

    return () => {
      cancelAnimationFrame(raf);
      observers.forEach((ro) => ro.disconnect());
      window.removeEventListener("resize", recomputeConnectors);
    };
  }, [sections, repScore, pageReady]);

  /* Lenis smooth scrolling. Mobile: the WINDOW scrolls (`.scroll` grows freely);
     desktop ≥900px: `.scroll` is the real scroller. Detect which and bind Lenis there. */
  const lenisRef = useRef(null);
  useEffect(() => {
    if (!pageReady) return undefined;
    const wrapper = scrollRef.current;
    if (!wrapper) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const wrapperScrolls = wrapper.scrollHeight > wrapper.clientHeight + 1;
    const lenis = wrapperScrolls
      ? new Lenis({ wrapper, content: wrapper.firstElementChild || wrapper, duration: 1.1, smoothWheel: true })
      : new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pageReady]);

  /* Smart open: the PATH is the first thing you see — land on the climber's current
     node (next to clear; the "1" start for new users), path above, base-camp info
     peeking below. The floating chip covers getting back down to the info. */
  useEffect(() => {
    if (didAutoScrollRef.current) return;
    if (!Object.keys(sectionConnectors).length) return;
    const wrapper = scrollRef.current;
    if (!wrapper) return;

    let targetEl = null;
    outer: for (const sec of sections) {
      for (const node of sec.nodes) {
        if (!node.locked && !node.done) {
          targetEl = nodeRefs.current.get(`${sec.id}::${node.id}`);
          break outer;
        }
      }
    }

    const wrapperScrolls = wrapper.scrollHeight > wrapper.clientHeight + 1;
    let top;
    if (targetEl) {
      const nr = targetEl.getBoundingClientRect();
      if (wrapperScrolls) {
        const wr = wrapper.getBoundingClientRect();
        top = wrapper.scrollTop + (nr.top - wr.top) - wr.height * 0.45;
      } else {
        top = window.scrollY + nr.top - window.innerHeight * 0.45;
      }
    } else {
      top = wrapperScrolls ? wrapper.scrollHeight : document.documentElement.scrollHeight;
    }
    /* Through Lenis when active — a raw scrollTop write would be snapped back to
       Lenis's internal position on its next raf. */
    if (lenisRef.current) lenisRef.current.scrollTo(top, { immediate: true });
    else if (wrapperScrolls) wrapper.scrollTop = top;
    else window.scrollTo(0, top);
    didAutoScrollRef.current = true;
  }, [sectionConnectors, sections]);

  /* Trigger the connector draw-in once geometry exists (skipped for reduced motion via CSS delays being harmless). */
  useEffect(() => {
    if (drawn) return undefined;
    if (!Object.keys(sectionConnectors).length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return undefined;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(raf);
  }, [sectionConnectors, drawn]);

  /* Show the floating return chip while the bottom info block is out of view.
     Viewport root works for both scroll modes (IO clips by scroll ancestors). */
  useEffect(() => {
    const info = infoRef.current;
    if (!info) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setShowChip(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(info);
    return () => io.disconnect();
  }, [pageReady]);

  /* Chip tap: glide back down to the info block at the base of the climb. */
  function scrollToInfo() {
    const el = infoRef.current;
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -64 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Reveal segments as they scroll into view (opacity only — transforms would skew connector geometry). */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    const els = Array.from(root.querySelectorAll(".rep-path-segment"));
    if (!els.length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections, pageReady]);

  const lvl = getLevel(repScore);
  const rank = rankData?.rank;
  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Student";
  const heroAvatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;

  function goBack() {
    const r = safeAppReturnTo(location.state);
    navigate(r || (isGuest ? "/" : "/profile"));
  }

  if (profilePending && !profile) {
    return (
      <div className="page fadein rep-path">
        <header className="topbar rep-path-topbar">
          <div className="rep-path-topbar__lead">
            <button type="button" className="btn bg-btn bico" onClick={() => navigate(safeAppReturnTo(location.state) || "/profile")} aria-label="Go back">
              <ArrowLeft size={15} />
            </button>
          </div>
          <div className="rep-path-topbar__title">Rep path</div>
          <div className="rep-path-topbar__trail">
            <span className="rep-path-topbar-spacer" aria-hidden />
          </div>
        </header>
        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
          <div className="rep-path__inner">
            <div className="rep-path-skel" aria-busy>
              <div className="rep-path-skel__circle" />
              <div className="rep-path-skel__line" />
              <div className="rep-path-skel__line" style={{ width: 100 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toNext = lvl.toNext;
  const nextLabel = lvl.next;
  const progPct = lvl.pct;

  function goToLeaderboard() {
    navigate("/profile?tab=leaderboard", { state: { returnTo: location.pathname } });
  }

  return (
    <div className="page fadein rep-path">
      <header className="topbar rep-path-topbar">
        <div className="rep-path-topbar__lead">
          <button type="button" className="btn bg-btn bico" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={15} />
          </button>
        </div>
        <div className="rep-path-topbar__title">Rep path</div>
        <div className="rep-path-topbar__trail">
          {rank ? (
            <button
              type="button"
              className="rep-path-topbar-rank"
              onClick={goToLeaderboard}
              aria-label={`View leaderboard, your campus rank is ${rank}`}
            >
              <span className="rep-path-topbar-rank__eyebrow">Leaderboard</span>
              <span className="rep-path-topbar-rank__value">#{rank}</span>
            </button>
          ) : (
            <span className="rep-path-topbar-spacer" aria-hidden />
          )}
        </div>
      </header>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar" ref={scrollRef}>
        <div className="rep-path__inner">
          <div className="rep-path-body">
            {/* Climb-up: Legend renders first (summit, under the hero); the banner sits BELOW its
                column so you meet each tier's sign as you enter it from the bottom. */}
            {climbSections.map((sec) => {
              const connectorData = sectionConnectors[sec.id];
              const markerPt = sec.unlocked && connectorData?.progressMarker ? connectorData.progressMarker : null;

              return (
                <section key={sec.id} aria-labelledby={`rep-sec-${sec.id}`}>
                  <div
                    className="rep-path-col"
                    ref={(el) => {
                      if (el) sectionRefs.current.set(sec.id, el);
                      else sectionRefs.current.delete(sec.id);
                    }}
                  >
                    {connectorData ? (
                      <svg
                        className="rep-path-svg"
                        viewBox={`0 0 ${connectorData.width} ${connectorData.height}`}
                        width="100%"
                        height={connectorData.height}
                        aria-hidden
                      >
                        {connectorData.paths.map((path) => (
                          <g key={path.id}>
                            {/* Paint-in: each segment draws itself in climb order (seq counts from the path start). */}
                            <path
                              d={path.d}
                              className="rep-path-svg__path rep-path-svg__path--todo"
                              pathLength="1"
                              style={{
                                strokeDasharray: "1 1",
                                strokeDashoffset: drawn ? 0 : 1,
                                transition: `stroke-dashoffset 0.4s ease-out ${path.seq * 0.07}s`,
                              }}
                            />
                            {path.progress > 0 ? (
                              <path
                                d={path.d}
                                className="rep-path-svg__path rep-path-svg__path--done"
                                pathLength="1"
                                strokeDasharray={drawn ? `${clamp01(path.progress)} 1` : "0 1"}
                                style={{
                                  transition: `stroke-dasharray 0.45s ease-out ${path.seq * 0.07 + 0.12}s`,
                                }}
                              />
                            ) : null}
                          </g>
                        ))}
                        {markerPt ? (
                          <g className="rep-path-marker-svg" pointerEvents="none">
                            <circle
                              cx={markerPt.x}
                              cy={markerPt.y}
                              r={6}
                              className="rep-path-marker-svg__dot"
                              style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.4s ease 1.1s" }}
                            />
                          </g>
                        ) : null}
                      </svg>
                    ) : null}

                    {markerPt ? (
                      <>
                        <button
                          type="button"
                          className="rep-path-marker-hit"
                          aria-label="Your position on this path — tap for a short note"
                          aria-expanded={markerHintSectionId === sec.id}
                          style={{
                            left: `${markerPt.x}px`,
                            top: `${markerPt.y}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarkerHintSectionId((id) => (id === sec.id ? null : sec.id));
                          }}
                        />
                        {markerHintSectionId === sec.id ? (
                          <div
                            className="rep-path-marker-hint"
                            role="tooltip"
                            style={{
                              left: `${markerPt.x}px`,
                              top: `${markerPt.y}px`,
                            }}
                          >
                            <span className="rep-path-marker-hint__text">You&apos;re here — your rep on this path.</span>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {sec.nodes.slice().reverse().map((node) => {
                      const key = `${sec.id}::${node.id}`;

                      return (
                        <div key={node.id} className="rep-path-segment">
                          <div className={`rep-path-row rep-path-row--${node.row}`}>
                            <PathStep
                              node={node}
                              nodeRef={(el) => {
                                if (el) nodeRefs.current.set(key, el);
                                else nodeRefs.current.delete(key);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div id={`rep-sec-${sec.id}`} className={`rep-path-banner rep-path-banner--${sec.bannerTone}`}>
                    <span className="rep-path-banner__label">{sec.label}</span>
                    <span className="rep-path-banner__range">{sec.range}</span>
                  </div>
                </section>
              );
            })}

            {/* Base camp: all rider info lives at the bottom, where the journey starts. */}
            <div className="rep-path-info" ref={infoRef}>
            <div className="rep-path-hero">
              {isGuest ? (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "2px solid #3f3f46",
                    background: "var(--rp-zinc-800)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 6px",
                    color: "var(--green)",
                  }}
                >
                  <GraduationCap size={20} strokeWidth={2} aria-hidden />
                </div>
              ) : (
                <UserAvatar
                  user={{
                    resolvedAvatarUrl: heroAvatarUrl,
                    avatar_color: profile?.avatar_color,
                    first_name: profile?.first_name,
                    last_name: profile?.last_name,
                  }}
                  size={44}
                  style={{ border: "2px solid var(--bd)", margin: "0 auto 6px" }}
                />
              )}
              <div className="rep-path-name">{isGuest ? "The Rep path" : fullName}</div>
              <div className="rep-path-campus">NMSU · Las Cruces</div>
              <div
                className="rep-path-badge"
                style={{
                  background: lvl.bg,
                  color: lvl.color,
                  borderColor: lvl.border,
                }}
              >
                <Award size={13} aria-hidden />
                {lvl.label}
              </div>
              <div className="rep-path-score">{repScore}</div>
              <div className="rep-path-score-lbl">Rep score</div>
              <div className="rep-path-prog">
                <div className="rep-path-prog__meta">
                  <span>
                    {lvl.label} · {repScore} pts
                  </span>
                  <span>{nextLabel ? `${toNext} to ${nextLabel}` : "Max level"}</span>
                </div>
                <div className="rep-path-prog__track">
                  <div className="rep-path-prog__fill" style={{ width: `${progPct}%`, background: lvl.color }} />
                </div>
              </div>
            </div>

            <div className="rep-path-stats">
              <div className="rep-path-stat">
                <div className="rep-path-stat__num" style={{ color: "var(--green-d)" }}>
                  {repScore}
                </div>
                <div className="rep-path-stat__lbl">Total rep</div>
              </div>
              <div className="rep-path-stat">
                <div className="rep-path-stat__num">{nextLabel ? toNext : "0"}</div>
                <div className="rep-path-stat__lbl">To next level</div>
              </div>
              <div className="rep-path-stat">
                <div className="rep-path-stat__num">{rank ? `#${rank}` : "—"}</div>
                <div className="rep-path-stat__lbl">Campus rank</div>
              </div>
            </div>

            <div className="rep-path-how">
              <div className="rep-path-how__title">How to earn rep</div>
              {REP_PATH_EARN_ROWS.map((row) => {
                const RowIcon = ICONS[row.icon] || Plus;
                return (
                  <div key={row.text} className="rep-path-how__row">
                    <div
                      className="rep-path-how__icon"
                      style={{
                        background: row.tone === "amber" ? "var(--amber-bg)" : "var(--green-bg)",
                      }}
                    >
                      <RowIcon size={16} color={row.tone === "amber" ? "var(--amber)" : "var(--green-d)"} aria-hidden />
                    </div>
                    <span className="rep-path-how__text">{row.text}</span>
                    <span className="rep-path-how__pts">{row.pts}</span>
                  </div>
                );
              })}
            </div>

            {isGuest ? (
              <div style={{ margin: "12px 14px 0" }}>
                <button
                  type="button"
                  className="btn bp bfull blg"
                  onClick={() => navigate("/welcome")}
                >
                  No rep? Get started
                </button>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Floating return chip — hovers while climbing; tap to glide back to base camp.
          Portaled to <body>: the page's fadein transform makes .page the containing
          block for position:fixed, which would pin the chip to the page, not the viewport. */}
      {createPortal(
      <button
        type="button"
        className={`rep-path-return-chip${showChip ? "" : " rep-path-return-chip--hidden"}`}
        onClick={scrollToInfo}
        aria-label="Jump back down to your stats"
        aria-hidden={!showChip}
        tabIndex={showChip ? 0 : -1}
      >
        {isGuest ? (
          <span className="rep-path-return-chip__avatar">
            <GraduationCap size={14} strokeWidth={2} aria-hidden />
          </span>
        ) : (
          <UserAvatar
            user={{
              resolvedAvatarUrl: heroAvatarUrl,
              avatar_color: profile?.avatar_color,
              first_name: profile?.first_name,
              last_name: profile?.last_name,
            }}
            size={24}
          />
        )}
        <span className="rep-path-return-chip__pts">{repScore} pts</span>
        {rank ? <span className="rep-path-return-chip__rank">#{rank}</span> : null}
        <ChevronDown size={14} aria-hidden />
      </button>,
      document.body
      )}
    </div>
  );
}
