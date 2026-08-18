/**
 * Cosmetics catalog + rarity roll — TEST scaffolding for the chest-opening flow.
 *
 * ⚠️ The roll here is CLIENT-SIDE and for prototyping the animation only. The real
 * draw must happen server-side (Supabase RPC) so outcomes can't be forced in
 * devtools; the client will then just animate a result the server already picked.
 */

export const RARITIES = {
  /* `textOnLight`: what this rarity's TEXT renders as on a white surface —
     cosmic's near-white would vanish, so it reads black instead. */
  common: { key: "common", label: "Common", color: "#16a34a", glow: "rgba(22,163,74,.55)", textOnLight: "#16a34a", weight: 60 },
  rare: { key: "rare", label: "Rare", color: "#2563eb", glow: "rgba(37,99,235,.55)", textOnLight: "#2563eb", weight: 25 },
  epic: { key: "epic", label: "Epic", color: "#7c3aed", glow: "rgba(124,58,237,.6)", textOnLight: "#7c3aed", weight: 12 },
  legendary: { key: "legendary", label: "Legendary", color: "#eab308", glow: "rgba(234,179,8,.65)", textOnLight: "#ca8a04", weight: 2.9 },
  cosmic: { key: "cosmic", label: "Cosmic", color: "#e2e8f0", glow: "rgba(255,255,255,.95)", textOnLight: "#0f172a", weight: 0.1 },
};

export const RARITY_ORDER = ["common", "rare", "epic", "legendary", "cosmic"];

/** Confetti palettes per rarity (hex only — canvas-confetti wants hex strings). */
export const RARITY_CONFETTI = {
  common: ["#16a34a", "#22c55e", "#86efac", "#f0fdf4"],
  rare: ["#2563eb", "#3b82f6", "#93c5fd", "#eff6ff"],
  epic: ["#7c3aed", "#a855f7", "#d8b4fe", "#faf5ff"],
  legendary: ["#eab308", "#facc15", "#fde68a", "#fffbeb"],
  cosmic: ["#e2e8f0", "#f8fafc", "#c7d2fe", "#ffffff"],
};

/**
 * Launch tag catalog — 50 equippable profile titles.
 * IDs are PERMANENT (future trading references them across accounts): never
 * rename or reuse one — retire an item by removing it from the drop pool.
 *
 * Rarity spread: 20 common / 14 rare / 9 epic / 5 legendary / 2 cosmic.
 * Commons skew ironic/self-aware (worn by choice, Rocket-League style);
 * rares are work-ethic + campus flavor; epic/legendary are earned-status
 * flexes; cosmic is the hunt.
 */
export const COSMETICS = [
  /* ---- TIER TAGS — the trust ladder, earned on the Rep path (never dropped).
     One per rarity; granted at the END of each 2-stage tier band. These are the
     SAME New/Reliable/Trusted/Legend shown on the rep card + hero, so the badge
     you wear is the badge you earned. `exclusive` keeps them out of chest rolls;
     `tier` maps to REP_LEVELS labels, `grantAtRep` to the milestone that awards it. */
  /* New is the FREE starter tag — owned + equipped automatically from rep 0
     (see STARTER_TAG_ID / cosmeticsInventory), so it has no `grantAtRep`; the
     earned tiers begin at Reliable. */
  { id: "t-tier-new", type: "tag", name: "New", rarity: "common", tier: "New", exclusive: true },
  { id: "t-tier-reliable", type: "tag", name: "Reliable", rarity: "rare", tier: "Reliable", grantAtRep: 200, exclusive: true },
  { id: "t-tier-trusted", type: "tag", name: "Trusted", rarity: "epic", tier: "Trusted", grantAtRep: 300, exclusive: true },
  { id: "t-tier-legend", type: "tag", name: "Legend", rarity: "legendary", tier: "Legend", grantAtRep: 400, exclusive: true },
  { id: "t-tier-cosmic", type: "tag", name: "Beyond Legend", rarity: "cosmic", tier: "Cosmic", grantAtRep: 500, exclusive: true },

  /* ---- COMMON (20) — ironic, personality, campus-life ---- */
  { id: "t-certified-goober", type: "tag", name: "Certified Goober", rarity: "common" },
  { id: "t-professional-amateur", type: "tag", name: "Professional Amateur", rarity: "common" },
  { id: "t-broke-but-motivated", type: "tag", name: "Broke But Motivated", rarity: "common" },
  { id: "t-ramen-funded", type: "tag", name: "Ramen Funded", rarity: "common" },
  { id: "t-financial-aid-recipient", type: "tag", name: "Financial Aid Recipient", rarity: "common" },
  { id: "t-doing-my-best", type: "tag", name: "Doing My Best", rarity: "common" },
  { id: "t-chronically-available", type: "tag", name: "Chronically Available", rarity: "common" },
  { id: "t-will-work-for-snacks", type: "tag", name: "Will Work for Snacks", rarity: "common" },
  { id: "t-mildly-employable", type: "tag", name: "Mildly Employable", rarity: "common" },
  { id: "t-just-happy-to-be-here", type: "tag", name: "Just Happy to Be Here", rarity: "common" },
  { id: "t-desert-rat", type: "tag", name: "Desert Rat", rarity: "common" },
  { id: "t-frenger-fueled", type: "tag", name: "Frenger Fueled", rarity: "common" },
  { id: "t-late-night-library", type: "tag", name: "Late Night Library", rarity: "common" },
  { id: "t-gpa-optional", type: "tag", name: "GPA Optional", rarity: "common" },
  { id: "t-slightly-feral", type: "tag", name: "Slightly Feral", rarity: "common" },
  { id: "t-caffeine-based-lifeform", type: "tag", name: "Caffeine Based Lifeform", rarity: "common" },
  { id: "t-down-for-whatever", type: "tag", name: "Down for Whatever", rarity: "common" },
  { id: "t-no-thoughts-just-gigs", type: "tag", name: "No Thoughts, Just Gigs", rarity: "common" },
  { id: "t-touch-grass-expert", type: "tag", name: "Touch Grass Expert", rarity: "common" },
  { id: "t-napping-champion", type: "tag", name: "Napping Champion", rarity: "common" },

  /* ---- RARE (14) — work ethic + Las Cruces / NMSU flavor ---- */
  { id: "t-dialed-in", type: "tag", name: "Dialed In", rarity: "rare" },
  { id: "t-certified-hustler", type: "tag", name: "Certified Hustler", rarity: "rare" },
  { id: "t-overbooked", type: "tag", name: "Overbooked", rarity: "rare" },
  { id: "t-first-to-reply", type: "tag", name: "First to Reply", rarity: "rare" },
  { id: "t-zero-excuses", type: "tag", name: "Zero Excuses", rarity: "rare" },
  { id: "t-clock-in-cash-out", type: "tag", name: "Clock In, Cash Out", rarity: "rare" },
  { id: "t-always-on-time", type: "tag", name: "Always On Time", rarity: "rare" },
  { id: "t-the-reliable-one", type: "tag", name: "The Reliable One", rarity: "rare" },
  { id: "t-booked-and-busy", type: "tag", name: "Booked & Busy", rarity: "rare" },
  { id: "t-aggie-grinder", type: "tag", name: "Aggie Grinder", rarity: "rare" },
  { id: "t-sun-belt-baller", type: "tag", name: "Sun Belt Baller", rarity: "rare" },
  { id: "t-dead-week-survivor", type: "tag", name: "Dead Week Survivor", rarity: "rare" },
  { id: "t-575-local", type: "tag", name: "575 Local", rarity: "rare" },
  { id: "t-crimson-regular", type: "tag", name: "Crimson Regular", rarity: "rare" },

  /* ---- EPIC (9) — earned-status flexes ---- */
  { id: "t-main-character", type: "tag", name: "Main Character", rarity: "epic" },
  { id: "t-the-plug", type: "tag", name: "The Plug", rarity: "epic" },
  { id: "t-known-on-campus", type: "tag", name: "Known On Campus", rarity: "epic" },
  { id: "t-big-rep-energy", type: "tag", name: "Big Rep Energy", rarity: "epic" },
  { id: "t-five-star-energy", type: "tag", name: "Five Star Energy", rarity: "epic" },
  { id: "t-built-different", type: "tag", name: "Built Different", rarity: "epic" },
  { id: "t-menace-to-society", type: "tag", name: "Menace to Society", rarity: "epic" },
  { id: "t-organ-mountain-high", type: "tag", name: "Organ Mountain High", rarity: "epic" },
  { id: "t-the-standard", type: "tag", name: "The Standard", rarity: "epic" },

  /* ---- LEGENDARY (5) — scarce on purpose; status markers ---- */
  { id: "t-campus-legend", type: "tag", name: "Campus Legend", rarity: "legendary" },
  { id: "t-founding-hustler", type: "tag", name: "Founding Hustler", rarity: "legendary" },
  { id: "t-top-of-the-board", type: "tag", name: "Top of the Board", rarity: "legendary" },
  { id: "t-gig-lord", type: "tag", name: "Gig Lord", rarity: "legendary" },
  { id: "t-untouchable", type: "tag", name: "Untouchable", rarity: "legendary" },

  /* ---- COSMIC (2) — the hunt ---- */
  { id: "t-cosmic-aura", type: "tag", name: "Cosmic Aura", rarity: "cosmic" },
  { id: "t-lucky-pull", type: "tag", name: "Lucky Pull", rarity: "cosmic" },
  { id: "t-im-the-best", type: "tag", name: "The One", rarity: "cosmic" },
  /* -----------------------------------------------------------------------
   * AVATAR BORDERS — 52 launch rings. `ring` is the CSS background painted as
   * the band. NO WHITE anywhere (the app's surfaces are white — a pale ring
   * vanishes). Honest naming: flat rings are called what they are; evocative
   * names are reserved for effects that earn them.
   *
   * `fx`  → animation class (borderFx.css). Epic+ only; rarity is legible at
   *         a glance: common = flat, rare = static gradient, epic = motion,
   *         legendary = motion + glow, cosmic = the grails.
   * `glow`→ static halo color (box-shadow); the fx brightens it so it breathes.
   * `dur` → overrides the effect's default speed (CSS var --bfx-dur).
   * `art` → inline-SVG overlay drawn ABOVE the photo (Rocket-League-style
   *         avatar frame) — the drawing overlaps the portrait edge a little.
   * ----------------------------------------------------------------------- */

  /* ---- COMMON (10) — flat rings, called what they are ---- */
  { id: "b-crimson-ring", type: "border", name: "Crimson Ring", rarity: "common", ring: "#8f1836" },
  { id: "b-forest-ring", type: "border", name: "Forest Ring", rarity: "common", ring: "#166534" },
  { id: "b-cobalt-ring", type: "border", name: "Cobalt Ring", rarity: "common", ring: "#1d4ed8" },
  { id: "b-charcoal-ring", type: "border", name: "Charcoal Ring", rarity: "common", ring: "#27272a" },
  { id: "b-tangerine-ring", type: "border", name: "Tangerine Ring", rarity: "common", ring: "#ea580c" },
  { id: "b-grape-ring", type: "border", name: "Grape Ring", rarity: "common", ring: "#7c3aed" },
  { id: "b-teal-ring", type: "border", name: "Teal Ring", rarity: "common", ring: "#0d9488" },
  { id: "b-rose-ring", type: "border", name: "Rose Ring", rarity: "common", ring: "#e11d48" },
  { id: "b-bronze-ring", type: "border", name: "Bronze Ring", rarity: "common", ring: "#92400e" },
  { id: "b-slate-ring", type: "border", name: "Slate Ring", rarity: "common", ring: "#475569" },

  /* ---- RARE (12) — static gradients & patterns ---- */
  { id: "b-sunset-fade", type: "border", name: "Sunset Fade", rarity: "rare", ring: "linear-gradient(135deg, #f97316, #ec4899)" },
  { id: "b-ocean-fade", type: "border", name: "Ocean Fade", rarity: "rare", ring: "linear-gradient(135deg, #1d4ed8, #0d9488)" },
  { id: "b-ember-fade", type: "border", name: "Ember Fade", rarity: "rare", ring: "linear-gradient(135deg, #7f1d1d, #f97316)" },
  { id: "b-twilight-fade", type: "border", name: "Twilight Fade", rarity: "rare", ring: "linear-gradient(135deg, #6d28d9, #2563eb)" },
  { id: "b-toxic-fade", type: "border", name: "Toxic Fade", rarity: "rare", ring: "linear-gradient(135deg, #15803d, #a3e635)" },
  { id: "b-gold-fade", type: "border", name: "Gold Fade", rarity: "rare", ring: "linear-gradient(135deg, #a16207, #fbbf24)" },
  /* Red cap on top, off-white belly below (the off-white is a shade DARKER than
     the page background so the split stays crisp), with the Pokéball's black
     band — on a ring that reads as two clean black separators at the 9- and
     3-o'clock seams where the halves meet. */
  { id: "b-poke-ball", type: "border", name: "Poke Ball", rarity: "rare", ring: "conic-gradient(from 270deg, #18181b 0deg 7deg, #dc2626 7deg 173deg, #18181b 173deg 187deg, #e2e8f0 187deg 353deg, #18181b 353deg 360deg)" },
  { id: "b-candy-stripe", type: "border", name: "Candy Stripe", rarity: "rare", ring: "repeating-conic-gradient(#dc2626 0 20deg, #f472b6 20deg 40deg)" },
  { id: "b-hazard-stripes", type: "border", name: "Hazard Stripes", rarity: "rare", ring: "repeating-conic-gradient(#18181b 0 18deg, #facc15 18deg 36deg)" },
  { id: "b-segmented", type: "border", name: "Segmented", rarity: "rare", ring: "repeating-conic-gradient(#0ea5e9 0 24deg, #0c4a6e 24deg 45deg)" },
  { id: "b-aggie-kit", type: "border", name: "Aggie Kit", rarity: "rare", ring: "conic-gradient(from 270deg, #8f1836 0 180deg, #27272a 180deg 360deg)" },

  /* ---- EPIC — animated; motion is the flex ---- */
  { id: "b-radar-sweep", type: "border", name: "Radar Sweep", rarity: "epic", fx: "spin", dur: "2.4s", ring: "conic-gradient(from 0deg, #082f49 0 285deg, #06b6d4 325deg, #a5f3fc 355deg, #082f49 360deg)" },
  /* Comet floats mid-band (same edge-margin layering as Event Horizon) —
     the tail ramps up behind a bright head that never touches the rims. */
  { id: "b-comet-tail", type: "border", name: "Comet Tail", rarity: "epic", fx: "spin", dur: "2s", ring: "radial-gradient(circle closest-side, #1e293b 0 83.5%, transparent 85% 94.5%, #1e293b 96% 100%), conic-gradient(from 0deg, #1e293b 0 140deg, #3b82f6 300deg, #93c5fd 350deg, #1e293b 352deg 360deg)" },
  /* A pale moon (moonlight silver) orbiting the deep-indigo night ring. */
  { id: "b-orbit", type: "border", name: "Orbit", rarity: "epic", fx: "spin", dur: "3.5s", ring: "conic-gradient(from 0deg, #312e81 0 342deg, #e2e8f0 348deg 356deg, #312e81 360deg)" },
  { id: "b-pulse", type: "border", name: "Pulse", rarity: "epic", fx: "pulse", glow: "rgba(219,39,119,.4)", ring: "linear-gradient(135deg, #db2777, #9d174d)" },
  { id: "b-heartbeat", type: "border", name: "Heartbeat", rarity: "epic", fx: "heartbeat", glow: "rgba(220,38,38,.4)", ring: "linear-gradient(135deg, #dc2626, #7f1d1d)" },
  { id: "b-marquee", type: "border", name: "Marquee", rarity: "epic", fx: "tick", dur: "1.6s", ring: "repeating-conic-gradient(#18181b 0 15deg, #f59e0b 15deg 30deg)" },
  { id: "b-snake", type: "border", name: "Snake", rarity: "epic", fx: "spin", dur: "3s", ring: "repeating-conic-gradient(#065f46 0 30deg, #34d399 30deg 60deg)" },
  /* Moved down from cosmic (it twinned with the old Hue Shift, now removed) —
     the oil-slick rainbow is the epic tier's crown piece. */
  { id: "b-prism-overdrive", type: "border", name: "Prism Overdrive", rarity: "epic", fx: "prism", dur: "7s", glow: "rgba(139,92,246,.45)", ring: "conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #8b5cf6, #ec4899, #ef4444)" },
  { id: "b-neon-sign", type: "border", name: "Neon Sign", rarity: "epic", fx: "neon", glow: "rgba(236,72,153,.5)", ring: "conic-gradient(from 45deg, #ec4899, #22d3ee, #ec4899, #22d3ee, #ec4899)" },
  { id: "b-lava-flow", type: "border", name: "Lava Flow", rarity: "epic", fx: "spin", dur: "7s", ring: "conic-gradient(#7f1d1d, #ea580c, #450a0a, #f97316, #7f1d1d)" },
  { id: "b-deep-current", type: "border", name: "Deep Current", rarity: "epic", fx: "spin", dur: "9s", ring: "conic-gradient(#0f172a, #1e3a8a, #0f172a, #2563eb, #0f172a)" },
  { id: "b-warning-lights", type: "border", name: "Warning Lights", rarity: "epic", fx: "spin", dur: "4s", ring: "repeating-conic-gradient(#18181b 0 18deg, #facc15 18deg 36deg)" },
  { id: "b-static-charge", type: "border", name: "Static Charge", rarity: "epic", fx: "jitter", glow: "rgba(99,102,241,.45)", ring: "linear-gradient(135deg, #4c1d95, #6366f1)" },

  /* ---- LEGENDARY (10) — motion + glow; the fire & electricity tier ---- */
  { id: "b-wildfire", type: "border", name: "Wildfire", rarity: "legendary", fx: "fire", glow: "rgba(249,115,22,.55)", ring: "linear-gradient(to top, #7f1d1d, #dc2626 35%, #f97316 65%, #fbbf24 92%)" },
  { id: "b-blue-blaze", type: "border", name: "Blue Blaze", rarity: "legendary", fx: "fire", glow: "rgba(34,211,238,.55)", ring: "linear-gradient(to top, #1e3a8a, #2563eb 40%, #06b6d4 70%, #67e8f9 95%)" },
  { id: "b-shadow-flame", type: "border", name: "Shadow Flame", rarity: "legendary", fx: "fire", glow: "rgba(168,85,247,.55)", ring: "linear-gradient(to top, #09090b, #18181b 40%, #6d28d9 75%, #a855f7 95%)" },
  { id: "b-high-voltage", type: "border", name: "High Voltage", rarity: "legendary", fx: "volt", glow: "rgba(34,211,238,.55)", ring: "conic-gradient(from 20deg, #22d3ee, #6366f1, #22d3ee, #a5b4fc, #6366f1, #22d3ee)" },
  { id: "b-crimson-storm", type: "border", name: "Crimson Storm", rarity: "legendary", fx: "volt", glow: "rgba(239,68,68,.55)", ring: "conic-gradient(#8f1836, #ef4444, #8f1836, #fb7185, #8f1836)" },
  { id: "b-molten-core", type: "border", name: "Molten Core", rarity: "legendary", fx: "pulse", dur: "3.2s", glow: "rgba(249,115,22,.5)", ring: "repeating-conic-gradient(#1c1917 0 40deg, #f97316 43deg 47deg, #1c1917 50deg 90deg)" },
  { id: "b-toxic-meltdown", type: "border", name: "Toxic Meltdown", rarity: "legendary", fx: "pulse", dur: "2.6s", glow: "rgba(34,197,94,.5)", ring: "conic-gradient(#14532d, #22c55e, #84cc16, #16a34a, #14532d)" },
  { id: "b-frostbite", type: "border", name: "Frostbite", rarity: "legendary", fx: "glint", glow: "rgba(34,211,238,.5)", ring: "linear-gradient(135deg, #0e7490, #22d3ee 50%, #0369a1)" },
  { id: "b-supersonic", type: "border", name: "Supersonic", rarity: "legendary", fx: "spin", dur: "1.6s", glow: "rgba(249,115,22,.5)", ring: "conic-gradient(from 0deg, #431407 0 70deg, #dc2626 120deg, #f97316 155deg, #fbbf24 180deg, #431407 215deg 360deg)" },
  { id: "b-gold-standard", type: "border", name: "Gold Standard", rarity: "legendary", fx: "spin", dur: "3.4s", glow: "rgba(234,179,8,.5)", ring: "conic-gradient(from 0deg, #a16207, #fbbf24, #ca8a04, #facc15, #a16207)" },

  /* ---- COSMIC (5) — the grails; wildcards are hand-granted, never dropped ---- */
  /* Black-hole band: three bright "asteroids" (cyan / violet / pink), each
     dragging a fading trail as they circle. The top radial layer paints thin
     black margins at the band's inner+outer edges so the asteroids float in
     the middle of the ring instead of touching its rims. */
  {
    id: "b-event-horizon",
    type: "border",
    name: "Event Horizon",
    rarity: "cosmic",
    fx: "spin",
    dur: "6s",
    glow: "rgba(139,92,246,.4)",
    ring: "radial-gradient(circle closest-side, #0a0a0a 0 83.5%, transparent 85% 94.5%, #0a0a0a 96% 100%), conic-gradient(from 0deg, #0a0a0a 0 70deg, #0e7490 100deg, #67e8f9 118deg, #0a0a0a 120deg 190deg, #6d28d9 220deg, #c4b5fd 238deg, #0a0a0a 240deg 310deg, #be185d 340deg, #f9a8d4 356deg, #0a0a0a 358deg 360deg)",
  },
  /* Founders Crimson: the gold cloud frame on a deep-crimson ring that flickers
     with a clean, subtle wildfire glow (warm red halo, calm flame). Custom gold
     cloud art (user), background removed, served as a static asset. */
  {
    id: "b-clouds",
    type: "border",
    name: "Founders Crimson",
    rarity: "cosmic",
    fx: "fire",
    dur: "2.2s",
    glow: "rgba(239,68,68,.5)",
    ring: "linear-gradient(180deg, #9f1239, #7f1d1d)",
    /* Two-part frame: a top band across the top of the ring + a slightly larger
       bottom band, each sized to keep the strip's own aspect (minimal stretch).
       `artFx: sway` drifts them gently side-to-side; the bottom layer's negative
       delay puts it in counter-phase so the frame breathes naturally. */
    artFx: "sway",
    artLayers: [
      { url: "/photos/clouds-top.svg", style: { left: "-13%", right: "-20%", top: "-21%", height: "46%" } },
      { url: "/photos/clouds-bottom.svg", style: { left: "-24%", right: "-24%", bottom: "-16%", height: "45%", animationDelay: "-2s" } },
    ],
  },
  /* Silver Shine — a white-and-silver CLOUDY SHIMMER ring, no drawn lines. Soft
     silver mids anchor it against white surfaces while two diffuse white
     highlights sweep around as it spins (a smooth shimmer). */
  {
    id: "b-wind",
    type: "border",
    name: "Silver Shine",
    rarity: "legendary",
    fx: "spin",
    dur: "5s",
    glow: "rgba(148,163,184,.6)",
    ring: "conic-gradient(from 0deg, #64748b, #cbd5e1 12%, #f1f5f9 22%, #ffffff 30%, #e2e8f0 42%, #94a3b8 55%, #e2e8f0 68%, #ffffff 78%, #cbd5e1 88%, #64748b 100%)",
  },
  /* Wind — the silver shimmer ring with the SAME cloud frame as Clouds, but
     desaturated to a metallic sugar-gray. The RING spins (fx) while the clouds
     stay put (no artFx), so the wind seems to blow past them. */
  {
    id: "b-wind-clouds",
    type: "border",
    name: "Founders Wind",
    rarity: "cosmic",
    fx: "spin",
    dur: "5s",
    glow: "rgba(148,163,184,.6)",
    ring: "conic-gradient(from 0deg, #64748b, #cbd5e1 12%, #f1f5f9 22%, #ffffff 30%, #e2e8f0 42%, #94a3b8 55%, #e2e8f0 68%, #ffffff 78%, #cbd5e1 88%, #64748b 100%)",
    artFx: "sway",
    artLayers: [
      { url: "/photos/clouds-top.svg", style: { left: "-13%", right: "-20%", top: "-21%", height: "46%", filter: "grayscale(1) brightness(1.12) contrast(1.04)" } },
      { url: "/photos/clouds-bottom.svg", style: { left: "-24%", right: "-24%", bottom: "-16%", height: "45%", filter: "grayscale(1) brightness(1.12) contrast(1.04)", animationDelay: "-2s" } },
    ],
  },
  /* Founders Kingdom — the swaying gold cloud frame set on the spinning Gold
     Standard ring. A founder wildcard (`exclusive`): hand-granted, never dropped. */
  {
    id: "b-founders-kingdom",
    type: "border",
    name: "Founders Kingdom",
    rarity: "cosmic",
    exclusive: true,
    fx: "spin",
    dur: "3.4s",
    glow: "rgba(234,179,8,.5)",
    ring: "conic-gradient(from 0deg, #a16207, #fbbf24, #ca8a04, #facc15, #a16207)",
    artFx: "sway",
    artLayers: [
      /* Static gold flame-glow at the TOP only — sits behind the clouds so the
         top of the frame looks lit. `noFx` keeps it from swaying. */
      { noFx: true, style: { top: "-26%", left: "-4%", right: "-4%", height: "48%", background: "radial-gradient(72% 92% at 50% 84%, rgba(253,224,71,.6), rgba(234,179,8,.26) 44%, transparent 70%)", filter: "blur(1.5px)" } },
      { url: "/photos/clouds-top.svg", style: { left: "-13%", right: "-20%", top: "-21%", height: "46%" } },
      { url: "/photos/clouds-bottom.svg", style: { left: "-24%", right: "-24%", bottom: "-16%", height: "45%", animationDelay: "-2s" } },
    ],
  },
  /* Wildcards — `exclusive`: NEVER drops from any chest. Hand-granted to
     alpha testers + the first 50 launch signups, then retired forever. */
  /* Aurora — northern-lights ribbons (deep night green → emerald → teal → cyan →
     violet) drifting slowly around the ring, with a teal-green glow. Epic tier,
     stepping into the retired Spinner's slot (a normal droppable epic). */
  { id: "b-founders-aura", type: "border", name: "Aurora", rarity: "epic", fx: "spin", dur: "5s", glow: "rgba(52,211,153,.6)", ring: "conic-gradient(from 210deg, #052e26, #059669, #10b981, #34d399, #22d3ee, #38bdf8, #8b5cf6, #10b981, #052e26)" },
  /* Glitch OG — the silvery live-wire ring; the snap-and-spark animation
     (bfx--glitch) carries the whole effect. */
  { id: "b-glitch-og", type: "border", name: "Glitch OG", rarity: "cosmic", exclusive: true, fx: "glitch", glow: "rgba(129,140,248,.5)", ring: "linear-gradient(135deg, #94a3b8, #c7d2fe 45%, #818cf8)" },
  /* Glitch — Steam-style glitched circle: a dark ring shattered into neon
     green/cyan/violet arc fragments (chromatic offsets baked in) with
     horizontal displacement BARS jutting past the edges and over the photo.
     `artFx` snaps the art layer itself, so the bars judder like a broken feed. */
  {
    id: "b-glitch",
    type: "border",
    name: "Glitch",
    rarity: "cosmic",
    exclusive: true,
    fx: "glitch",
    artFx: "glitch",
    glow: "rgba(43,255,136,.45)",
    ring: "conic-gradient(from 0deg, #23e6ff, #6d28d9, #2bff88, #22d3ee, #7a5cff, #16d97a, #23e6ff)",
    art: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none'%3E%3Ccircle cx='50' cy='50' r='40' stroke='%237a5cff' stroke-width='7' stroke-dasharray='30 14 44 20 24 32' transform='rotate(10 50 50)'/%3E%3Ccircle cx='51.5' cy='50' r='40' stroke='%232bff88' stroke-width='6' stroke-dasharray='38 22 18 30 40 16' transform='rotate(-30 50 50)'/%3E%3Ccircle cx='48.5' cy='50' r='40' stroke='%2323e6ff' stroke-width='6' stroke-dasharray='26 18 36 24 20 40' transform='rotate(140 50 50)'/%3E%3Ccircle cx='50' cy='50' r='40' stroke='%239ff3ff' stroke-width='2.5' stroke-dasharray='10 70 16 40 8 30' transform='rotate(80 50 50)'/%3E%3C/g%3E%3Cg%3E%3Crect x='72' y='34' width='20' height='4.5' fill='%2323e6ff'/%3E%3Crect x='5' y='46' width='21' height='5' fill='%232bff88'/%3E%3Crect x='74' y='58' width='20' height='4' fill='%237a5cff'/%3E%3Crect x='8' y='66' width='16' height='4' fill='%2323e6ff'/%3E%3Crect x='36' y='6' width='16' height='3.5' fill='%232bff88'/%3E%3Crect x='50' y='90' width='18' height='3.5' fill='%237a5cff'/%3E%3C/g%3E%3C/svg%3E",
  },
];

/**
 * The trust-ladder tags, low → high. Single source of truth for both the
 * Rep-path grants (by `grantAtRep`) and the tier badge on the rep card/hero
 * (by `tier`, which matches REP_LEVELS labels).
 */
export const TIER_TAGS = COSMETICS.filter((c) => c.type === "tag" && c.tier);

/** The free starter tag every user owns + wears by default (the "New" tier). */
export const STARTER_TAG_ID = "t-tier-new";

/** The tier tag awarded when a milestone at `targetRep` is cleared, or null. */
export function tierTagForRep(targetRep) {
  return TIER_TAGS.find((t) => t.grantAtRep === targetRep) || null;
}

/** The tier tag for a REP_LEVELS label ("New"/"Reliable"/…), or null. */
export function tierTagForLabel(label) {
  return TIER_TAGS.find((t) => t.tier === label) || null;
}

/** Weighted rarity roll (kept for the real drop table later). */
export function rollRarity() {
  const total = RARITY_ORDER.reduce((sum, k) => sum + RARITIES[k].weight, 0);
  let roll = Math.random() * total;
  for (const k of RARITY_ORDER) {
    roll -= RARITIES[k].weight;
    if (roll <= 0) return k;
  }
  return "common";
}

/** Standard chests only ever hold Common / Rare / Epic. */
const STANDARD_POOL_RARITIES = new Set(["common", "rare", "epic"]);

/** TEST roll for a STANDARD chest: uniform across its pool so every burst
 *  color is easy to see. Real odds later: ~75/20/5. */
export function rollTestCosmetic() {
  const pool = COSMETICS.filter((c) => STANDARD_POOL_RARITIES.has(c.rarity) && !c.exclusive);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * GUEST DEMO roll ("Get Fake Prize" on the Rep path): 1-in-5 lands a
 * LEGENDARY, the rest come from the standard pool. Nothing is ever banked —
 * the demo exists to sell the chest feeling to logged-out visitors.
 */
export function rollDemoCosmetic() {
  if (Math.random() < 0.2) {
    const legends = COSMETICS.filter((c) => c.rarity === "legendary" && !c.exclusive);
    return legends[Math.floor(Math.random() * legends.length)];
  }
  return rollTestCosmetic();
}

/**
 * Legendary chest drop table: Epic / Legendary / Cosmic ONLY, with a heavily
 * boosted Cosmic slot (10% per ball vs the base 0.1%) — the "pick 1 of 3"
 * chest is the cosmic hunt.
 */
export const LEGENDARY_WEIGHTS = { epic: 55, legendary: 35, cosmic: 10 };

/** Roll `count` DISTINCT cosmetics for the legendary pick-one-of-three reveal. */
export function rollLegendaryChoices(count = 3) {
  const pool = COSMETICS.filter((c) => (LEGENDARY_WEIGHTS[c.rarity] || 0) > 0 && !c.exclusive);
  const out = [];
  while (out.length < count && pool.length) {
    const total = pool.reduce((sum, c) => sum + LEGENDARY_WEIGHTS[c.rarity], 0);
    let roll = Math.random() * total;
    let chosen = pool[0];
    for (const c of pool) {
      roll -= LEGENDARY_WEIGHTS[c.rarity];
      if (roll <= 0) {
        chosen = c;
        break;
      }
    }
    out.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return out;
}
