# CampusGig — working agreement

## #1 rule: One thing = one component (no lookalike duplicates)

Every visual/logic unit is a **single shared component ("one unison lego brick")**, imported
everywhere it appears. If the same thing renders in two places, it must be the **same component**,
not two copies of the markup. When a change to "the X" only updates one place and another place
drifts, that is a **hole** — and holes are the bug, even when nothing looks broken yet.

### You must actively spot holes — every task, before and after editing
Before changing any UI or logic unit, search for **other places that render the same thing**
(same className, same shape, same copy) and confirm they route through one component. If they don't:
1. Call it out to the user immediately (don't silently patch one side).
2. Prefer consolidating into the shared component over duplicating the edit.
3. Never "fix" a hole by copy-pasting the change into both copies — that deepens it.

Signals a hole exists:
- The same `className` block (e.g. `rep-card`, `rc-badge`, `rc-labels`) appears in more than one file.
- The same catalog/array is hardcoded in multiple files (e.g. `["New","Reliable","Trusted","Legend"]`).
- An edit to a component doesn't visibly change a screen you expected it to.

### Second kind of hole: display that isn't backed by the real state
A badge/label/count that is *computed for show* but not backed by the actual
source-of-truth state is a hole, because two surfaces will disagree. Example we
hit: the profile showed a green **"New"** badge (a `lv-new` fallback derived from
rep score), while the Inventory said **"No tag equipped"** (the real cosmetics
state) — same concept, two answers.

How to spot it:
- The same fact is shown in two places and one is derived (fallback/placeholder)
  while the other reads real persisted state — check they can't disagree.
- A "default"/"automatic" thing (a starter item, an implied selection) is drawn
  in the UI but never written to the state that other screens read.
- Ask: "If I open every screen that shows this, do they all read the SAME source?"

The fix (offer it when you spot one): make the default real in the single source
of truth so every surface reads it — don't paper over it with a per-screen
fallback. (We fixed the example by seeding the "New" tag as owned+equipped in
`cosmeticsInventory` via `STARTER_TAG_ID`, so profile + rep card + Inventory agree.)

### Known holes to close (do not add more)
- **Rep card is duplicated.** `src/features/profile/components/ProfileRepCard.jsx` is the real
  component, but `src/pages/Home.jsx` re-implements the entire `.rep-card` markup inline
  (authed + guest variants). They have already drifted (tier colors changed on one, not the other).
  → Home should render `<ProfileRepCard .../>`; the guest variant should be a prop/variant of the
  same component. Fold the hardcoded tier labels + `lvl` styling into the one component so a single
  edit updates the profile page, Home, and everywhere else at once.

## Architecture notes
- **Tiers / tags / rep path are one connected system.** New/Reliable/Trusted/Legend live in
  `src/data/repLevels.js`; the rep-path game layer is `src/utils/repPathModel.js`; the badge is the
  shared `TagBadge`/`LevelBadge` (`src/components/EquippedTagBadge.jsx`, `LevelBadge.jsx`). A logic
  change to one (thresholds, tier→tag mapping, colors) must be made at its single source of truth so
  it flows to the rep card, the rep-path hero, the inventory, and gig cards together.
- Cosmetics catalog + rarity live in `src/data/cosmetics.js` (IDs are permanent — never rename/reuse).
- Chest claims and cosmetics inventory are **localStorage scaffolding** today; the real draw/grant
  moves server-side (Supabase RPC). Write grant/claim logic so that swap is a drop-in.
