import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import { RARITIES, RARITY_CONFETTI, rollTestCosmetic, rollLegendaryChoices, rollDemoCosmetic } from "../data/cosmetics";
import { collectCosmetic, equipCosmetic } from "../lib/cosmeticsInventory";
import CosmeticRing from "./CosmeticRing";
import "./prizeMachine.css";

/**
 * Prize Machine — Crossy Road-style voxel vending machine (pure CSS 3D, no extra
 * deps) + action-burst reveal.
 *
 * Anticipation chain (12-principles: wind-up → action → follow-through):
 *   idle    machine breathes, "Open" pulses
 *   windup  rig leans back + squashes slightly, dial twists with overshoot (0.5s)
 *   shake   machine wobbles, capsules tumble in the glass (0.7s)
 *   drop    body squashes as the capsule pops out, falls, LANDS with squash-and-
 *           stretch (0.65s)
 *   beat    capsule rocks… stillness… (0.45s)
 *   burst   pop → rays + confetti + prize springs in
 *
 * TEST MODE: rolls client-side between two tags. Real flow will animate a
 * server-picked result instead.
 */

const CAPSULE_COLORS = {
  common: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#facc15",
  cosmic: "#f1f5f9",
};

const GLASS_DOTS = ["#22c55e", "#3b82f6", "#a855f7", "#facc15", "#f1f5f9", "#3b82f6", "#22c55e"];

/** Twinkle positions around the centered prize (gamified sparkle). */
const SPARKLES = [
  { x: "24%", y: "34%", size: 22 },
  { x: "74%", y: "30%", size: 16 },
  { x: "82%", y: "52%", size: 20 },
  { x: "16%", y: "54%", size: 15 },
  { x: "64%", y: "24%", size: 14 },
  { x: "34%", y: "66%", size: 17 },
];

const LAMP_CYCLE = [
  CAPSULE_COLORS.common,
  CAPSULE_COLORS.rare,
  CAPSULE_COLORS.epic,
  CAPSULE_COLORS.legendary,
  CAPSULE_COLORS.cosmic,
];

/** Ball color → legible text color on a white surface (cosmic would vanish). */
const TEXT_ON_LIGHT = {
  [CAPSULE_COLORS.common]: RARITIES.common.textOnLight,
  [CAPSULE_COLORS.rare]: RARITIES.rare.textOnLight,
  [CAPSULE_COLORS.epic]: RARITIES.epic.textOnLight,
  [CAPSULE_COLORS.legendary]: RARITIES.legendary.textOnLight,
  [CAPSULE_COLORS.cosmic]: RARITIES.cosmic.textOnLight,
};

/**
 * Slot-machine color shuffle for a roof lamp: two fast loops through every
 * rarity, decelerating (convex time spacing) until it LOCKS on the rolled
 * rarity — the capsule that drops is the same color, so the tell is honest.
 * `offset` rotates the cycle so multiple lamps don't spin in lockstep.
 * `textSeq` mirrors `seq` with white-safe text colors for the rarity box.
 */
function buildLampKeyframes(finalColor, offset = 0) {
  const cycle = LAMP_CYCLE.map((_, i) => LAMP_CYCLE[(i + offset) % LAMP_CYCLE.length]);
  const seq = [...cycle, ...cycle, cycle[0], cycle[1], finalColor];
  const times = seq.map((_, i) => Math.pow(i / (seq.length - 1), 1.7));
  const textSeq = seq.map((c) => TEXT_ON_LIGHT[c] || c);
  return { seq, times, textSeq };
}

/** Rig pose per phase (dimetric corner view: front + right + top faces visible).
    Pokéball rhythm: three DISCRETE shakes with dead-still pauses between them,
    each stronger than the last — the stillness is the suspense. */
const REST_POSE = { rotateX: -22, rotateY: -34, scaleY: 1, scaleX: 1, rotateZ: 0, x: 0 };
const RIG_POSES = {
  idle: REST_POSE,
  windup: { rotateX: -16, rotateY: -27, scaleY: 0.962, scaleX: 1.02, rotateZ: 0, x: 0 },
  shake1: { ...REST_POSE, rotateZ: [0, -1.8, 1.9, -1.1, 0], x: [0, -3, 3, -2, 0] },
  pause1: REST_POSE,
  shake2: { ...REST_POSE, rotateZ: [0, -3, 3.2, -2.4, 1.4, 0], x: [0, -5, 5, -4, 2, 0] },
  pause2: REST_POSE,
  shake3: { ...REST_POSE, rotateZ: [0, -4.4, 4.6, -4, 3.4, -2, 0], x: [0, -7, 7, -6, 5, -3, 0] },
  drop: { rotateX: -22, rotateY: -34, scaleY: [1, 0.952, 1.018, 1], scaleX: [1, 1.045, 0.988, 1], rotateZ: 0, x: 0 },
  beat: REST_POSE,
};

const SHAKE_PHASES = new Set(["shake1", "shake2", "shake3"]);
/** Glass-capsule jiggle strength per shake (escalates with the machine). */
const SHAKE_STRENGTH = { shake1: 0.5, shake2: 0.8, shake3: 1.2 };

/**
 * `chestType` comes from the path node that opened this ("standard" checkpoint
 * or "legendary" stage cap). `onSettled` fires exactly once per roll, when the
 * reward is banked — the path uses it to mark the chest claimed.
 *
 * `demo` (guest "Get Fake Prize"): full animation, 1-in-5 legendary roll,
 * but NOTHING is collected or equipped — the outro says so.
 */
export default function PrizeMachineModal({ open, onClose, chestType = "standard", onSettled, repScore = 0, rank = null, demo = false, fixedReward = null, fixedChoices = null, onPickOption = null }) {
  const [phase, setPhase] = useState("idle"); // idle | windup | shake1..3 (+pauses) | drop | beat | burst
  const [prize, setPrize] = useState(null);
  /** Legendary chest: 3 rolled options; user keeps one. */
  const [choices, setChoices] = useState(null);
  const [picked, setPicked] = useState(null);
  /** Hovered choice index — neighbors repel away so the pills never crowd. */
  const [hoverIdx, setHoverIdx] = useState(null);
  /** "Leave?" confirmation — shown when closing mid-roll. */
  const [confirmLeave, setConfirmLeave] = useState(false);
  /** True once this roll's reward has been banked (collect/equip/auto). */
  const settledRef = useRef(false);
  const timersRef = useRef([]);
  const confettiRef = useRef(null);
  const canvasRef = useRef(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setPrize(null);
      setChoices(null);
      setPicked(null);
      setConfirmLeave(false);
      settledRef.current = false;
    }
    return clearTimers;
  }, [open, clearTimers]);

  /** One award per roll — and the path learns the chest is claimed. */
  const markSettled = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled?.();
  }, [onSettled]);

  /* Once a roll starts, its outcome is COMMITTED — closing can never discard
     it (no reroll cheese). Standard: auto-collect. Legendary without a pick:
     a random option is picked for you, then collected. */
  const settleRoll = useCallback(() => {
    if (demo) return; // demo rolls are never banked
    if (settledRef.current) return;
    if (chestType === "legendary" && choices?.length) {
      const kept = picked || choices[Math.floor(Math.random() * choices.length)];
      if (onPickOption) onPickOption(kept); // server commits the pick + grants
      else collectCosmetic(kept.id);
      markSettled();
    } else if (prize) {
      collectCosmetic(prize.id);
      markSettled();
    }
  }, [demo, chestType, choices, picked, prize, markSettled, onPickOption]);

  /** Close attempts route here: mid-roll → confirm; otherwise close directly. */
  const requestClose = useCallback(() => {
    /* Demo has nothing at stake — never interrupt the close with a confirm. */
    const rollActive = !demo && phase !== "idle" && !settledRef.current && (prize || choices?.length);
    if (!rollActive) {
      onClose();
      return;
    }
    setConfirmLeave(true);
  }, [demo, phase, prize, choices, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  /** Accepts a rarity key OR an explicit color array (legendary = all 3 balls). */
  const fireConfetti = useCallback((rarityOrColors) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!confettiRef.current) {
      confettiRef.current = confetti.create(canvas, { resize: true, useWorker: true });
    }
    const fire = confettiRef.current;
    const colors = Array.isArray(rarityOrColors)
      ? rarityOrColors
      : RARITY_CONFETTI[rarityOrColors] || RARITY_CONFETTI.common;

    /* Impact pop from center… */
    fire({ particleCount: 110, spread: 110, startVelocity: 38, origin: { x: 0.5, y: 0.45 }, colors, ticks: 200, scalar: 0.95, disableForReducedMotion: true });
    /* …stadium cannons from the bottom corners… */
    timersRef.current.push(
      setTimeout(() => {
        fire({ particleCount: 45, angle: 60, spread: 55, startVelocity: 46, origin: { x: 0, y: 1 }, colors, ticks: 210, scalar: 0.95, disableForReducedMotion: true });
        fire({ particleCount: 45, angle: 120, spread: 55, startVelocity: 46, origin: { x: 1, y: 1 }, colors, ticks: 210, scalar: 0.95, disableForReducedMotion: true });
      }, 140)
    );
    /* …then celebratory rain from the top. */
    const rain = (delay, x) => {
      timersRef.current.push(
        setTimeout(() => {
          fire({ particleCount: 26, angle: 270, spread: 150, startVelocity: 16, gravity: 0.75, origin: { x, y: -0.08 }, colors, ticks: 240, scalar: 0.85, disableForReducedMotion: true });
        }, delay)
      );
    };
    rain(260, 0.25);
    rain(460, 0.75);
    rain(760, 0.5);
  }, []);

  const startOpen = useCallback(() => {
    if (phase !== "idle") return;
    setPicked(null);
    settledRef.current = false;
    if (fixedReward) {
      /* Predetermined single prize (server-granted standard/tier reward, or a
         tier tag) — no roll, just reveal it. Single-capsule flow, any rarity. */
      setChoices(null);
      setPrize(fixedReward);
    } else if (fixedChoices?.length) {
      /* Server-picked legendary options — reveal the 3 the server committed. */
      setChoices(fixedChoices);
      setPrize(null);
    } else if (chestType === "legendary" && !demo) {
      setChoices(rollLegendaryChoices(3));
      setPrize(null);
    } else {
      setChoices(null);
      setPrize(demo ? rollDemoCosmetic() : rollTestCosmetic());
    }

    if (reducedMotion) {
      setPhase("burst");
      return;
    }

    /* Pokéball timeline: wind-up, then shake…(still)…shake…(still)…SHAKE → out. */
    setPhase("windup");
    const steps = [
      ["shake1", 500],
      ["pause1", 1050],
      ["shake2", 1500],
      ["pause2", 2080],
      ["shake3", 2530],
      ["drop", 3200],
      ["beat", 3850],
      ["burst", 4300],
    ];
    for (const [p, t] of steps) {
      timersRef.current.push(setTimeout(() => setPhase(p), t));
    }
  }, [phase, chestType, reducedMotion, demo, fixedReward, fixedChoices]);

  useEffect(() => {
    if (phase !== "burst") return;
    if (chestType === "legendary" && choices) {
      /* Picking phase: confetti in ALL THREE ball rarities. */
      fireConfetti([...new Set(choices.flatMap((c) => RARITY_CONFETTI[c.rarity]))]);
    } else if (prize) {
      fireConfetti(prize.rarity);
    }
  }, [phase, prize, chestType, choices, fireConfetti]);

  /** Legendary: keep one of the three — re-theme everything to the pick. */
  const pickChoice = useCallback(
    (choice) => {
      setPicked(choice);
      setHoverIdx(null);
      fireConfetti(choice.rarity);
      if (onPickOption) {
        onPickOption(choice); // server commits the pick + grants
        markSettled();
      }
    },
    [fireConfetti, onPickOption, markSettled]
  );

  if (!open) return null;

  /* Theming: standard chest = the rolled prize's rarity; legendary chest = gold
     until the user picks, then the picked tag's rarity takes over the screen. */
  const shownPrize = chestType === "legendary" ? picked : prize;
  const hasRoll = Boolean(prize || (choices && choices.length));
  const rarity = shownPrize
    ? RARITIES[shownPrize.rarity]
    : chestType === "legendary" && hasRoll
      ? RARITIES.legendary
      : prize
        ? RARITIES[prize.rarity]
        : null;
  const machineVisible = phase !== "burst";
  const capsuleColor = shownPrize
    ? CAPSULE_COLORS[shownPrize.rarity]
    : chestType === "legendary"
      ? CAPSULE_COLORS.legendary
      : prize
        ? CAPSULE_COLORS[prize.rarity]
        : "#22c55e";
  const rigPose = RIG_POSES[phase] || RIG_POSES.idle;

  /* Rarity color choreography: idle = neutral; windup+shake = decelerating
     color shuffle (spans both phases, ends as the drop begins); after that =
     locked on the rolled color. The roof lamp AND the leaderboard pill run the
     same sequence so the whole frame telegraphs the rarity together. `color`
     mirrors backgroundColor so the CSS glow (currentColor) follows. */
  const SHUFFLE_PHASES = ["windup", "shake1", "pause1", "shake2", "pause2", "shake3"];
  const rarityShuffling = SHUFFLE_PHASES.includes(phase) && hasRoll;
  const rarityLocked = (phase === "drop" || phase === "beat" || phase === "burst") && hasRoll;
  const shuffleKf = rarityShuffling ? buildLampKeyframes(capsuleColor) : null;
  /* Spans windup → shake3 so the lamps lock exactly as the balls come out. */
  const shuffleTransition = { duration: 3.15, times: shuffleKf?.times, ease: "linear" };

  /* Locked text on the white rarity box must stay legible (cosmic → black). */
  const lockedTextColor = rarity?.textOnLight || capsuleColor;

  let standingAnim;
  if (rarityShuffling) {
    standingAnim = {
      box: { borderColor: shuffleKf.seq },
      text: { color: shuffleKf.textSeq },
      transition: shuffleTransition,
    };
  } else if (rarityLocked) {
    standingAnim = {
      box: { borderColor: capsuleColor },
      text: { color: lockedTextColor },
      transition: { duration: 0.25 },
    };
  } else {
    standingAnim = {
      box: { borderColor: "#e4e4e7" },
      text: { color: "#18181b" },
      transition: { duration: 0.3 },
    };
  }

  /* Roof lamps: one for standard; THREE for legendary — each shuffles its own
     offset color cycle and locks to ITS ball's rarity (lamp i ↔ capsule i). */
  const lampBalls = chestType === "legendary" && choices ? choices : [null];
  const lampAnimFor = (ball, i) => {
    const finalColor = ball ? CAPSULE_COLORS[ball.rarity] : capsuleColor;
    if (rarityShuffling) {
      const kf = buildLampKeyframes(finalColor, i * 2);
      return {
        animate: { backgroundColor: kf.seq, color: kf.seq, scale: 1, y: 0 },
        transition: {
          backgroundColor: shuffleTransition,
          color: shuffleTransition,
          /* Disney pop-out: squash-stretch overshoot as each lamp appears. */
          scale: { type: "spring", stiffness: 430, damping: 11, delay: 0.05 + i * 0.13 },
          y: { type: "spring", stiffness: 430, damping: 11, delay: 0.05 + i * 0.13 },
        },
      };
    }
    if (rarityLocked) {
      return {
        animate: { backgroundColor: finalColor, color: finalColor, scale: [1, 1.22, 1], y: 0 },
        transition: { scale: { repeat: Infinity, duration: 0.85, ease: "easeInOut", delay: i * 0.12 } },
      };
    }
    return {
      animate: { backgroundColor: "#a1a1aa", color: "#a1a1aa", scale: 1, y: 0 },
      transition: { duration: 0.3 },
    };
  };

  return createPortal(
    <div
      className={`pm-overlay${phase === "burst" ? " pm-overlay--burst" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Prize machine"
      style={rarity ? { "--pm-color": rarity.color, "--pm-glow": rarity.glow } : undefined}
    >
      <button type="button" className="pm-backdrop" aria-label="Close" onClick={requestClose} />

      {/* Full-screen sunburst wheel behind the win screen. During the legendary
          picking phase the rays cycle through ALL THREE ball rarities. */}
      {phase === "burst" ? (
        <motion.div
          className="pm-sunburst"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          aria-hidden
        >
          <div
            className="pm-sunburst__wheel"
            style={
              chestType === "legendary" && choices && !picked
                ? {
                    background: `repeating-conic-gradient(from 0deg, ${RARITIES[choices[0].rarity].glow} 0deg 9deg, transparent 9deg 22.5deg, ${RARITIES[choices[1].rarity].glow} 22.5deg 31.5deg, transparent 31.5deg 45deg, ${RARITIES[choices[2].rarity].glow} 45deg 54deg, transparent 54deg 67.5deg)`,
                  }
                : undefined
            }
          />
        </motion.div>
      ) : null}

      <canvas ref={canvasRef} className="pm-confetti" aria-hidden />

      {/* Rarity box(es) — shuffle with the lamps, then lock and name the roll.
          Legendary shows THREE (one per ball, popping in on the lamps' stagger)
          until a pick collapses it back to the kept tag's single box. */}
      <div className="pm-rarity-stack">
        {(chestType === "legendary" && choices && !picked ? choices : [null]).map((ball, i, arr) => {
          const multi = arr.length > 1;
          const ballRarity = ball ? RARITIES[ball.rarity] : null;
          let boxAnim;
          if (ball && rarityShuffling) {
            const kf = buildLampKeyframes(CAPSULE_COLORS[ball.rarity], i * 2);
            boxAnim = { box: { borderColor: kf.seq }, text: { color: kf.textSeq }, transition: shuffleTransition };
          } else if (ball && rarityLocked) {
            boxAnim = {
              box: { borderColor: ballRarity.color },
              text: { color: ballRarity.textOnLight },
              transition: { duration: 0.25 },
            };
          } else {
            boxAnim = standingAnim;
          }
          const label = ball
            ? rarityLocked
              ? ballRarity.label
              : "?"
            : rarityLocked && rarity
              ? rarity.label
              : "?";
          return (
            <motion.div
              key={ball ? ball.id : "main"}
              className="pm-rarity-box"
              initial={multi ? { scale: 0, y: -10, opacity: 0 } : false}
              animate={{ ...boxAnim.box, scale: 1, y: 0, opacity: 1 }}
              transition={{
                ...boxAnim.transition,
                /* Same cartoon pop stagger as the roof lamps. */
                scale: { type: "spring", stiffness: 430, damping: 12, delay: 0.05 + i * 0.13 },
                y: { type: "spring", stiffness: 430, damping: 12, delay: 0.05 + i * 0.13 },
                opacity: { duration: 0.18, delay: 0.05 + i * 0.13 },
              }}
              aria-label={label === "?" ? "Rarity: rolling" : `Rarity: ${label}`}
            >
              <span className="pm-rarity-box__eyebrow">Rarity</span>
              <motion.span
                className="pm-rarity-box__value"
                animate={boxAnim.text}
                transition={boxAnim.transition}
              >
                {label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      <button type="button" className="pm-close" onClick={requestClose} aria-label="Close prize machine">
        <X size={17} strokeWidth={2.4} />
      </button>

      <div className="pm-stage">
        <AnimatePresence mode="wait">
          {machineVisible ? (
            <motion.div
              key="machine"
              className="pm-machine-wrap"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.86, y: 6, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="pm-title">{demo ? "Prize machine — demo" : "Prize machine"}</div>

              {/* Dimetric voxel machine — pure CSS 3D (front / right / top faces). */}
              <div className="pm3-scene">
                <motion.div
                  className="pm3-rig"
                  animate={rigPose}
                  transition={
                    SHAKE_PHASES.has(phase)
                      ? { duration: phase === "shake3" ? 0.62 : 0.52, ease: "easeInOut" }
                      : phase === "drop"
                        ? { duration: 0.5, times: [0, 0.3, 0.7, 1], ease: "easeOut" }
                        : { type: "spring", stiffness: 260, damping: 20 }
                  }
                >
                  {/* Rarity lamp(s) on the roof: shuffle colors, lock on the
                      roll. Legendary pops out THREE — cartoon squash-stretch —
                      one per ball, left to right. */}
                  {lampBalls.map((ball, i) => {
                    const anim = lampAnimFor(ball, i);
                    const multi = lampBalls.length > 1;
                    return (
                      <motion.span
                        key={multi ? `lamp-${i}` : "lamp"}
                        className="pm3-lamp"
                        style={{ marginLeft: -9 + (multi ? (i - 1) * 38 : 0) }}
                        initial={multi ? { scale: 0, y: 12 } : false}
                        animate={anim.animate}
                        transition={anim.transition}
                      />
                    );
                  })}

                  <div className="pm3-box pm3-roof">
                    <div className="pf pf-front" />
                    <div className="pf pf-right" />
                    <div className="pf pf-top" />
                  </div>

                  <div className="pm3-box pm3-glass">
                    <div className="pf pf-front">
                      <div className="pm3-dots">
                        {GLASS_DOTS.map((c, i) => (
                          <motion.span
                            key={i}
                            className="pm3-dot"
                            style={{ background: c }}
                            animate={
                              SHAKE_PHASES.has(phase)
                                ? {
                                    y: [0, (-8 - (i % 3) * 4) * SHAKE_STRENGTH[phase], 0, (-5 - (i % 2) * 5) * SHAKE_STRENGTH[phase], 0],
                                    rotate: [0, (i % 2 ? 16 : -16) * SHAKE_STRENGTH[phase], 0],
                                  }
                                : { y: 0, rotate: 0 }
                            }
                            transition={SHAKE_PHASES.has(phase) ? { duration: 0.55, ease: "easeInOut" } : undefined}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pf pf-right" />
                    <div className="pf pf-top" />
                  </div>

                  <div className="pm3-box pm3-body">
                    <div className="pf pf-front">
                      <motion.div
                        className="pm3-dial"
                        animate={phase === "windup" ? { rotate: [0, 128, 108] } : { rotate: 0 }}
                        transition={phase === "windup" ? { duration: 0.46, times: [0, 0.7, 1], ease: "easeInOut" } : undefined}
                      >
                        <span className="pm3-dial__bar" />
                      </motion.div>
                      <div className="pm3-chute" />
                    </div>
                    <div className="pf pf-right" />
                  </div>

                  <div className="pm3-box pm3-base">
                    <div className="pf pf-front" />
                    <div className="pf pf-right" />
                    <div className="pf pf-top" />
                  </div>
                </motion.div>

                <div className="pm3-shadow" aria-hidden />

                {/* Dispensed capsule(s): fall from the chute, LAND with squash &
                    stretch. Legendary drops THREE, staggered, each tinted by
                    its rolled tag's rarity. */}
                <AnimatePresence>
                  {(phase === "drop" || phase === "beat") &&
                    (chestType === "legendary" && choices ? choices : [shownPrize || prize]).map((c, i) => (
                      <motion.div
                        key={c?.id || i}
                        className="pm-capsule"
                        style={{
                          "--pm-capsule": c ? CAPSULE_COLORS[c.rarity] : capsuleColor,
                          marginLeft: chestType === "legendary" ? -21 + (i - 1) * 46 : -21,
                        }}
                        initial={{ y: -10, scaleY: 0.6, scaleX: 0.6, opacity: 0 }}
                        animate={
                          phase === "beat"
                            ? { y: 96, scaleY: 1, scaleX: 1, opacity: 1, rotate: [0, -7, 7, -3, 0] }
                            : {
                                y: [-10, 96, 88, 96],
                                scaleY: [0.6, 1, 0.76, 1.05, 1],
                                scaleX: [0.6, 1, 1.24, 0.97, 1],
                                opacity: 1,
                                rotate: 0,
                              }
                        }
                        transition={
                          phase === "beat"
                            ? { rotate: { duration: 0.4, ease: "easeInOut", delay: i * 0.08 } }
                            : { duration: 0.6, times: [0, 0.52, 0.68, 0.86, 1], ease: [0.5, 0, 1, 1], delay: i * 0.16 }
                        }
                      >
                        <span className="pm-capsule__top" />
                        <span className="pm-capsule__bottom" />
                        <span className="pm-capsule__shine" />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>

              {phase === "idle" ? (
                <motion.button
                  type="button"
                  className="pm-open-btn"
                  onClick={startOpen}
                  whileTap={{ scale: 0.96 }}
                  animate={{ scale: [1, 1.035, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                >
                  {demo ? "Get fake prize" : chestType === "legendary" ? "Open legendary chest" : "Open chest"}
                </motion.button>
              ) : (
                <div className="pm-open-btn pm-open-btn--ghost" aria-hidden>
                  Opening…
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="burst"
              className={`pm-burst${chestType === "legendary" && !picked ? " pm-burst--choices" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {/* Impact frame: one-shot flash + expanding shockwave ring. */}
              {!reducedMotion && (
                <>
                  <motion.div
                    className="pm-flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.85, 0] }}
                    transition={{ duration: 0.42, times: [0, 0.16, 1], ease: "easeOut" }}
                    aria-hidden
                  />
                  <motion.span
                    className="pm-shell pm-shell--top"
                    style={{ "--pm-capsule": capsuleColor }}
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: -74, y: -96, rotate: -50, opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                  <motion.span
                    className="pm-shell pm-shell--bottom"
                    style={{ "--pm-capsule": capsuleColor }}
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: 78, y: -60, rotate: 54, opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                  {SPARKLES.map((s, i) => (
                    <motion.span
                      key={i}
                      className="pm-sparkle"
                      style={{ left: s.x, top: s.y, fontSize: s.size }}
                      initial={{ scale: 0, opacity: 0, rotate: -20 }}
                      animate={{ scale: [0, 1, 0.55, 1], opacity: [0, 1, 0.6, 1], rotate: 12 }}
                      transition={{ delay: 0.28 + i * 0.1, duration: 1.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                      aria-hidden
                    >
                      ✦
                    </motion.span>
                  ))}
                </>
              )}

              {/* What you got, as a header — the Rocket League pattern: type text
                  on top, rarity spoken through color alone. */}
              <motion.div
                className="pm-prize-eyebrow"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
              >
                {demo
                  ? "Fake prize — demo only"
                  : chestType === "legendary" && !picked
                    ? "Pick one to keep"
                    : shownPrize?.type === "border"
                      ? "Profile border unlocked"
                      : "Profile tag unlocked"}
              </motion.div>

              {chestType === "legendary" && !picked && choices ? (
                /* Legendary: three tags hover in — tap one to keep it. */
                <div className="pm-choices">
                  {choices.map((c, i) => {
                    /* Neighbors ease away from the hovered pill (natural repel). */
                    const repelY = hoverIdx == null || hoverIdx === i ? 0 : i < hoverIdx ? -13 : 13;
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        className="pm-choice"
                        style={{
                          "--choice-color": RARITIES[c.rarity].color,
                          "--choice-glow": RARITIES[c.rarity].glow,
                        }}
                        initial={{ scale: 0, y: 24, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.12 + i * 0.14 }}
                        whileTap={{ scale: 0.96 }}
                        onPointerEnter={() => setHoverIdx(i)}
                        onPointerLeave={() => setHoverIdx((v) => (v === i ? null : v))}
                        onFocus={() => setHoverIdx(i)}
                        onBlur={() => setHoverIdx((v) => (v === i ? null : v))}
                        onClick={() => pickChoice(c)}
                        aria-label={`Keep ${c.name} (${RARITIES[c.rarity].label})`}
                      >
                        {/* Repel layer: no entrance delay, so hover reacts instantly. */}
                        <motion.span
                          className="pm-choice__repel"
                          animate={{ y: repelY, scale: hoverIdx === i ? 1.06 : 1 }}
                          transition={{ type: "spring", stiffness: 320, damping: 22 }}
                        >
                          <motion.span
                            className="pm-choice__inner"
                            animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
                            transition={
                              reducedMotion
                                ? undefined
                                : { repeat: Infinity, duration: 2.2 + i * 0.35, ease: "easeInOut", delay: i * 0.45 }
                            }
                          >
                            {c.type === "border" ? (
                              /* THE shared ring — same as avatars, so the pick
                                 shows the border's real animation + art. */
                              <CosmeticRing cosmetic={c} size={27} style={{ flex: "none" }}>
                                <span className="pm-choice__ring-ph">?</span>
                              </CosmeticRing>
                            ) : null}
                            <span className="pm-choice__name">{c.name}</span>
                          </motion.span>
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  className="pm-prize"
                  initial={{ scale: 0, rotate: -14 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 290, damping: 13, delay: 0.05 }}
                >
                  {/* Glow + shockwave anchor to the prize so everything shares one center. */}
                  <div className="pm-glow" aria-hidden />
                  {!reducedMotion && (
                    <motion.span
                      className="pm-shockwave"
                      initial={{ scale: 0.2, opacity: 0.95 }}
                      animate={{ scale: 7.5, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      aria-hidden
                    />
                  )}
                  {/* The reveal IS the item itself — a tag pill, or an avatar
                      border modeled on a gray "?" placeholder profile. */}
                  {shownPrize?.type === "border" ? (
                    <motion.div
                      className="pm-prize__border"
                      animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
                      transition={reducedMotion ? undefined : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    >
                      {/* THE shared ring — identical to a real avatar's border,
                          so the reveal shows the actual animation + art. */}
                      <CosmeticRing
                        cosmetic={shownPrize}
                        size={118}
                        style={{ boxShadow: "0 0 44px var(--pm-glow), 0 18px 34px rgba(0, 0, 0, 0.45)" }}
                      >
                        <span className="pm-avatar-ring__ph" aria-hidden>?</span>
                      </CosmeticRing>
                      <span className="pm-prize__border-name">{shownPrize.name}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="pm-prize__tag"
                      animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
                      transition={reducedMotion ? undefined : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    >
                      <span className="pm-prize__tag-name">{shownPrize?.name}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {chestType === "legendary" && !picked && !demo ? null : demo ? (
                /* Demo outro: honest — nothing was banked; the path to real
                   prizes is signing up and climbing the Rep path. */
                <motion.div
                  className="pm-actions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.28, ease: "easeOut" }}
                >
                  <div className="pm-demo-note">
                    Just a demo — nothing was added. Sign up and climb the Rep path to earn real prizes.
                  </div>
                  <div className="pm-actions__row">
                    <button type="button" className="pm-collect" onClick={onClose}>
                      Got it
                    </button>
                  </div>
                </motion.div>
              ) : (
              <motion.div
                className="pm-actions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.28, ease: "easeOut" }}
              >
                <div className="pm-actions__row">
                  <button
                    type="button"
                    className="pm-collect"
                    onClick={() => {
                      if (shownPrize) {
                        collectCosmetic(shownPrize.id);
                        markSettled();
                      }
                      onClose();
                    }}
                  >
                    Collect
                  </button>
                  <button
                    type="button"
                    className="pm-continue"
                    onClick={() => {
                      if (shownPrize) {
                        collectCosmetic(shownPrize.id); // count the drop (dupes stack)
                        equipCosmetic(shownPrize);
                        markSettled();
                      }
                      onClose();
                    }}
                  >
                    Equip now
                  </button>
                </div>
              </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leave confirmation — the roll is committed; leaving banks it. */}
      {confirmLeave ? (
        <div className="pm-confirm" role="alertdialog" aria-label="Leave the prize machine?">
          <button type="button" className="pm-confirm__dim" aria-label="Stay" onClick={() => setConfirmLeave(false)} />
          <motion.div
            className="pm-confirm__card"
            initial={{ scale: 0.9, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <div className="pm-confirm__title">Leave the prize machine?</div>
            <div className="pm-confirm__sub">
              {chestType === "legendary" && !picked
                ? "Your three options are already rolled — if you leave, one will be picked for you at random."
                : "Your reward is already decided — it will be collected automatically."}
            </div>
            <div className="pm-confirm__row">
              <button type="button" className="pm-confirm__stay" onClick={() => setConfirmLeave(false)}>
                Stay
              </button>
              <button
                type="button"
                className="pm-confirm__leave"
                onClick={() => {
                  settleRoll();
                  setConfirmLeave(false);
                  onClose();
                }}
              >
                Collect &amp; leave
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
