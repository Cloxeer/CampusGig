/**
 * Rep path: score-based checkpoints (1 → 300), Duolingo-style sections + gates at 50 / 150 / 300.
 */

const GATE = { reliable: 50, trusted: 150, legend: 300 };

/** @param {{ target: number, title: string, blurb?: string }} c */
function checkpoint(id, row, target, title, blurb) {
  return {
    id,
    kind: "checkpoint",
    row,
    targetRep: target,
    title,
    subtitle: blurb || `${target} rep`,
    done: false,
    locked: true,
    active: false,
  };
}

function milestone(id, row, targetRep, title, subtitle, icon, variant) {
  return {
    id,
    kind: "milestone",
    row,
    targetRep,
    title,
    subtitle,
    icon,
    variant,
    done: false,
    locked: true,
    active: false,
  };
}

const ROW_CYCLE = ["center", "right", "left"];

function withRows(checkpoints) {
  return checkpoints.map((c, i) => ({ ...c, row: ROW_CYCLE[i % ROW_CYCLE.length] }));
}

/** Campus-friendly section copy */
const SECTION_BLUEPRINT = [
  {
    id: "new",
    label: "The Quad · First steps",
    range: "0 – 49 rep",
    bannerTone: "neutral",
    minGate: 0,
    checkpoints: withRows([
      { target: 1, title: "You showed up", blurb: "Your first rep — nice." },
      { target: 10, title: "Double digits", blurb: "Early momentum counts." },
      { target: 20, title: "Finding your rhythm", blurb: "Keep stacking small wins." },
      { target: 30, title: "Campus is noticing", blurb: "You’re building trust." },
      { target: 40, title: "Almost to blue", blurb: "One more push in this tier." },
      { target: 49, title: "Top of the class (almost)", blurb: "Next stop: Reliable." },
    ]),
    milestone: milestone("m-reliable", "center", GATE.reliable, "Reach Reliable", "50 rep", "trophy", "reliable"),
  },
  {
    id: "reliable",
    label: "Honor roll energy · Reliable",
    range: "50 – 149 rep",
    bannerTone: "blue",
    minGate: GATE.reliable,
    checkpoints: withRows([
      { target: 60, title: "Settling in", blurb: "You earned the blue badge." },
      { target: 75, title: "Showing up for people", blurb: "Consistency is everything." },
      { target: 90, title: "Mid-semester grind", blurb: "Keep the streak alive." },
      { target: 105, title: "Trusted neighbor vibes", blurb: "Peers can count on you." },
      { target: 120, title: "Campus regular", blurb: "You’re part of the fabric." },
      { target: 135, title: "Almost green tier", blurb: "Trusted is in sight." },
      { target: 149, title: "Reliable — maxed out", blurb: "Ready for the next chapter." },
    ]),
    milestone: milestone("m-trusted", "right", GATE.trusted, "Reach Trusted", "150 rep", "trophy", "trusted"),
  },
  {
    id: "trusted",
    label: "Go-to on campus · Trusted",
    range: "150 – 299 rep",
    bannerTone: "green",
    minGate: GATE.trusted,
    checkpoints: withRows([
      { target: 165, title: "Green tier unlocked", blurb: "Serious campus cred." },
      { target: 185, title: "Raising the bar", blurb: "Quality over quantity." },
      { target: 205, title: "Main character semester", blurb: "You set the tone." },
      { target: 225, title: "Community anchor", blurb: "People talk about you (in a good way)." },
      { target: 250, title: "Halfway to purple", blurb: "Legend is on the horizon." },
      { target: 275, title: "Finals-week focus", blurb: "Finish strong." },
      { target: 299, title: "Trusted — peak", blurb: "Next up: Legend status." },
    ]),
    milestone: null,
  },
  {
    id: "legend",
    label: "Senior week forever · Legend",
    range: "300+ rep",
    bannerTone: "purple",
    minGate: GATE.legend,
    checkpoints: [],
    milestone: milestone("m-champ", "center", GATE.legend, "Campus legend", "300 rep — welcome to the top", "crown", "champ"),
  },
];

function buildRawNodes(blueprint) {
  const out = [];
  for (const cp of blueprint.checkpoints) {
    out.push(
      checkpoint(`cp-${blueprint.id}-${cp.target}`, cp.row, cp.target, cp.title, cp.blurb || `${cp.target} rep`)
    );
  }
  if (blueprint.milestone) out.push(blueprint.milestone);
  return out;
}

/**
 * @param {{ score: number }} input
 */
export function buildRepPathSections({ score }) {
  const sections = SECTION_BLUEPRINT.map((bp) => ({
    id: bp.id,
    label: bp.label,
    range: bp.range,
    bannerTone: bp.bannerTone,
    minGate: bp.minGate,
    nodes: buildRawNodes(bp),
  }));

  const gated = sections.map((sec) => {
    const unlocked = score >= sec.minGate;
    if (!unlocked) {
      return {
        ...sec,
        unlocked: false,
        nodes: sec.nodes.map((n) => ({ ...n, done: false, locked: true, active: false })),
      };
    }

    const cps = sec.nodes.filter((n) => n.kind === "checkpoint");
    const ms = sec.nodes.find((n) => n.kind === "milestone") || null;

    let activeId = null;
    const nextCp = cps.find((c) => score < c.targetRep);
    if (nextCp) activeId = nextCp.id;
    else if (ms && score < ms.targetRep) activeId = ms.id;

    const nodes = sec.nodes.map((n) => {
      if (n.kind === "checkpoint") {
        const done = score >= n.targetRep;
        const active = false;
        const locked = !done && !(nextCp && n.id === nextCp.id);
        return { ...n, done, active, locked };
      }
      if (n.kind === "milestone") {
        const done = score >= n.targetRep;
        const active = Boolean(!done && n.id === activeId);
        const locked = !done && !active;
        return { ...n, done, active, locked };
      }
      return n;
    });

    return { ...sec, unlocked: true, nodes };
  });

  return gated;
}

export const REP_PATH_EARN_ROWS = [
  { text: "Post a gig", pts: "+2", tone: "green", icon: "plus" },
  { text: "Mark your gig done (poster)", pts: "+8", tone: "green", icon: "check" },
  { text: "Complete a gig you took (taker)", pts: "+10", tone: "green", icon: "award" },
  { text: "Receive a review", pts: "+1 per star (1–5)", tone: "amber", icon: "star" },
];
