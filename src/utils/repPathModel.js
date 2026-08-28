/**
 * Rep path 2.0 — endless, evenly-spaced "Candy Crush" progression.
 *
 * The climb never ends: stages are generated on the fly from the user's score.
 * Every stage is the SAME size (50 rep) with the SAME spacing (a checkpoint every
 * 10 rep), so each chest costs the same amount of work no matter how high you are.
 *
 *   • Each stage = 50 rep = 4 standard-chest checkpoints + 1 legendary-chest milestone.
 *   • Every checkpoint carries a STANDARD chest; every stage milestone a LEGENDARY chest.
 *   • Each stage has its own title (campus-journey themed; auto-generated past the list).
 *   • Only the current stage + REVEAL_AHEAD stages are drawn; beyond that a single
 *     locked "horizon" node shows a lock icon so the path visibly keeps going.
 *
 * Coarse trust tiers (New / Reliable / Trusted / Legend) still come from REP_LEVELS
 * via getLevel() — this file only drives the game/checkpoint layer.
 */

import { tierTagForRep } from "../data/cosmetics";

const STAGE_SIZE = 50; // rep per stage
/** Stage 2 ("First Name Basis") starts here. Contact coach runs below this. */
export const FIRST_NAME_BASIS_MIN_REP = STAGE_SIZE;

export function isBeforeFirstNameBasis(score) {
  return (Number(score) || 0) < FIRST_NAME_BASIS_MIN_REP;
}

/** Spot coaching (gig contacts, alerts, inventory) until First Name Basis
 *  (end of stage 1 / 50 rep). After that he stays quiet. */
export function isSpotTutorialActive(score) {
  return isBeforeFirstNameBasis(score);
}
const CHECKPOINT_STEP = 10; // rep between chests
const CHECKPOINTS_PER_STAGE = 4; // standard chests before the stage's legendary
/** Stages drawn ahead of the current one; the rest collapse into a locked horizon. */
const REVEAL_AHEAD = 5;

const ROW_CYCLE = ["center", "right", "left"];
/** How many of the next stage's checkpoints peek out of the fog at the summit. */
const FRONTIER_PEEK = 2;
/** Short encouragements under each checkpoint (one per checkpoint slot in a stage). */
const CHECKPOINT_WORDS = ["Warming up", "Finding a groove", "Locked in", "One to the drop"];

/**
 * Stage names, grouped in pairs by trust tier — each tier spans TWO stages and
 * the tier's tag is earned at the end of the second (see TIER_TAGS):
 *   1–2  New        · earn "New"          @100 rep
 *   3–4  Reliable   · earn "Reliable"     @200 rep
 *   5–6  Trusted    · earn "Trusted"      @300 rep
 *   7–8  Legend     · earn "Legend"       @400 rep
 *   9–10 Cosmic     · earn "Beyond Legend"@500 rep
 * Past this list the climb continues with generated chapters (see stageMeta).
 */
const STAGE_TITLES = [
  // New tier
  { title: "Joined the Squad", blurb: "Where every gig starts." },
  { title: "First Name Basis", blurb: "People are learning your name." },
  // Reliable tier
  { title: "Regular Rotation", blurb: "You show up, every time." },
  { title: "The Reliable One", blurb: "Dependable, on the clock." },
  // Trusted tier
  { title: "Word of Mouth", blurb: "Your name gets passed around." },
  { title: "Trusted Hands", blurb: "People request you by name." },
  // Legend tier
  { title: "Big Rep Energy", blurb: "A campus heavyweight." },
  { title: "Campus Legend", blurb: "Everyone knows the name." },
  // Cosmic tier
  { title: "Off the Charts", blurb: "Past what anyone's done." },
  { title: "Beyond Legend", blurb: "The ceiling — then past it." },
];

function stageMeta(index) {
  if (index < STAGE_TITLES.length) return STAGE_TITLES[index];
  const chapter = index - STAGE_TITLES.length + 1;
  return { title: `Uncharted · Chapter ${chapter}`, blurb: "The climb never ends." };
}

/** A standard-chest checkpoint node. `slot` is its 1-based position within the stage. */
function makeCheckpoint(stageIndex, target, slot) {
  return {
    id: `cp-${stageIndex}-${target}`,
    kind: "checkpoint",
    chest: "standard",
    targetRep: target,
    title: `${target} rep`,
    subtitle: target === 1 ? "You showed up" : CHECKPOINT_WORDS[(slot - 1) % CHECKPOINT_WORDS.length],
    done: false,
    locked: true,
    active: false,
  };
}

/**
 * The stage's capstone. Two kinds, driven by TIER_TAGS (single source of truth):
 *   • End of a tier band (100/200/300/400/500 rep) → a TIER chest that grants
 *     that tier's tag (New/Reliable/Trusted/Legend/Beyond Legend).
 *   • Every other milestone (the halfway 50/150/… and everything past the
 *     ladder) → a Legendary prize chest.
 */
function makeMilestone(stageIndex, target) {
  const tierTag = tierTagForRep(target);
  return {
    id: `ms-${stageIndex}-${target}`,
    kind: "milestone",
    chest: tierTag ? "tier" : "legendary",
    rewardTagId: tierTag ? tierTag.id : null,
    targetRep: target,
    title: tierTag ? `“${tierTag.name}” tag` : "Legendary chest",
    subtitle: tierTag ? `${tierTag.tier} tier reward` : `Stage ${stageIndex + 1} reward`,
    icon: "crown",
    variant: tierTag ? tierTag.rarity : "prize",
    done: false,
    locked: true,
    active: false,
  };
}

/** Build one stage's raw nodes (rows + gating applied afterward). */
function buildStageNodes(stageIndex) {
  const start = stageIndex * STAGE_SIZE;
  const nodes = [];
  // Instant first win: stage 1 opens with a "1 rep" checkpoint so a brand-new
  // user lights a node (and earns a chest) with their very first action.
  if (stageIndex === 0) {
    nodes.push(makeCheckpoint(stageIndex, 1, 0));
  }
  for (let slot = 1; slot <= CHECKPOINTS_PER_STAGE; slot += 1) {
    nodes.push(makeCheckpoint(stageIndex, start + slot * CHECKPOINT_STEP, slot));
  }
  nodes.push(makeMilestone(stageIndex, start + STAGE_SIZE));
  return nodes.map((n, k) => ({ ...n, row: ROW_CYCLE[k % ROW_CYCLE.length] }));
}

/** Apply done/active/locked to a stage's nodes based on the user's score. */
function gateStage(stageIndex, score) {
  const start = stageIndex * STAGE_SIZE;
  const meta = stageMeta(stageIndex);
  const rawNodes = buildStageNodes(stageIndex);
  const unlocked = score >= start;

  const base = {
    id: `stage-${stageIndex + 1}`,
    stageNumber: stageIndex + 1,
    label: meta.title,
    range: `${start + 1} – ${start + STAGE_SIZE} rep`,
    /* One brand: every stage banner is CampusGig green (frontier stays neutral). */
    bannerTone: "green",
    minGate: start,
  };

  if (!unlocked) {
    return {
      ...base,
      unlocked: false,
      nodes: rawNodes.map((n) => ({ ...n, done: false, locked: true, active: false })),
    };
  }

  const cps = rawNodes.filter((n) => n.kind === "checkpoint");
  const ms = rawNodes.find((n) => n.kind === "milestone") || null;

  const nextCp = cps.find((c) => score < c.targetRep) || null;
  let activeId = null;
  if (nextCp) activeId = nextCp.id;
  else if (ms && score < ms.targetRep) activeId = ms.id;

  const nodes = rawNodes.map((n) => {
    if (n.kind === "checkpoint") {
      const done = score >= n.targetRep;
      const locked = !done && !(nextCp && n.id === nextCp.id);
      return { ...n, done, active: false, locked };
    }
    // milestone
    const done = score >= n.targetRep;
    const active = Boolean(!done && n.id === activeId);
    const locked = !done && !active;
    return { ...n, done, active, locked };
  });

  return { ...base, unlocked: true, nodes };
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * @param {{ score: number }} input
 * @returns sections ordered low → high (the page reverses them for the climb view).
 */
export function buildRepPathSections({ score }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const currentStageIndex = Math.floor(safeScore / STAGE_SIZE);
  const lastClearIndex = currentStageIndex + (REVEAL_AHEAD - 1);

  const sections = [];
  for (let i = 0; i <= lastClearIndex; i += 1) {
    sections.push(gateStage(i, safeScore));
  }

  // Fogged frontier: the NEXT stage is rendered for real but ghosted behind a
  // gradient that dissolves into the page (Rocket-League style). Its name stays
  // hidden; the fog lifts (`reveal` → 1) as the user climbs through their current
  // stage, so the peek only opens up when they're closing in on it.
  const frontier = gateStage(lastClearIndex + 1, safeScore);
  const peekNodes = frontier.nodes.filter((n) => n.kind === "checkpoint").slice(0, FRONTIER_PEEK);
  const intoStage = safeScore - currentStageIndex * STAGE_SIZE;
  const reveal = clamp01(intoStage / STAGE_SIZE);
  sections.push({
    ...frontier,
    nodes: peekNodes,
    isFrontier: true,
    reveal,
    /** Rep until the next stage clears the fog (one stage boundary away). */
    repToUnlock: STAGE_SIZE - intoStage,
    label: "The climb continues",
    range: "Unlocks as you climb",
    bannerTone: "neutral",
  });

  return sections;
}

export const REP_PATH_EARN_ROWS = [
  { text: "Post a gig", pts: "+2", tone: "green", icon: "plus" },
  { text: "Mark your gig done", pts: "+8", tone: "green", icon: "check" },
  { text: "Complete a taken gig", pts: "+10", tone: "green", icon: "award" },
  { text: "Receive a review", pts: "+1 per ★", tone: "amber", icon: "star" },
];
