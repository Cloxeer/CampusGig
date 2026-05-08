import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Check, Star, Award, Trophy, Lock, Crown } from "lucide-react";
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
  const sectionRefs = useRef(new Map());
  const nodeRefs = useRef(new Map());

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
  const repScore = profile?.rep_score ?? 0;

  const { data: rankData } = useQuery({
    queryKey: ["campusRank", repScore],
    queryFn: () => getCampusRank(repScore),
    enabled: !!profile,
  });

  const sections = useMemo(() => buildRepPathSections({ score: repScore }), [repScore]);

  useLayoutEffect(() => {
    function recomputeConnectors() {
      const next = {};

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
  }, [sections, repScore]);

  const lvl = getLevel(repScore);
  const rank = rankData?.rank;
  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Student";
  const heroAvatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;

  function goBack() {
    const r = safeAppReturnTo(location.state);
    navigate(r || "/profile");
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

  if (!profile) {
    return null;
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

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div className="rep-path__inner">
          <div className="rep-path-hero">
            <UserAvatar
              user={{
                resolvedAvatarUrl: heroAvatarUrl,
                avatar_color: profile?.avatar_color,
                first_name: profile?.first_name,
                last_name: profile?.last_name,
              }}
              size={58}
              style={{ border: "2px solid #3f3f46", background: "var(--rp-zinc-800)", margin: "0 auto 8px" }}
            />
            <div className="rep-path-name">{fullName}</div>
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

          <div className="rep-path-body">
            {sections.map((sec) => {
              const connectorData = sectionConnectors[sec.id];
              const markerPt = sec.unlocked && connectorData?.progressMarker ? connectorData.progressMarker : null;

              return (
                <section key={sec.id} aria-labelledby={`rep-sec-${sec.id}`}>
                  <div id={`rep-sec-${sec.id}`} className={`rep-path-banner rep-path-banner--${sec.bannerTone}`}>
                    <span className="rep-path-banner__label">{sec.label}</span>
                    <span className="rep-path-banner__range">{sec.range}</span>
                  </div>
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
                            <path d={path.d} className="rep-path-svg__path rep-path-svg__path--todo" />
                            {path.progress > 0 ? (
                              <path
                                d={path.d}
                                className="rep-path-svg__path rep-path-svg__path--done"
                                pathLength="1"
                                strokeDasharray={`${clamp01(path.progress)} 1`}
                              />
                            ) : null}
                          </g>
                        ))}
                        {markerPt ? (
                          <g className="rep-path-marker-svg" pointerEvents="none">
                            <circle cx={markerPt.x} cy={markerPt.y} r={6} className="rep-path-marker-svg__dot" />
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

                    {sec.nodes.map((node) => {
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
                </section>
              );
            })}

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
          </div>
        </div>
      </div>
    </div>
  );
}
