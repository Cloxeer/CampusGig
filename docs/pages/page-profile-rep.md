# Profile Rep Path

**Route:** `/profile/rep`

================================================================================

WHAT IT IS

  Reputation (Karma Kredit) detail and level path for the current user.
  Replaces the old rep detail modal (`?rep` query param).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Reached from the rep card on `/profile`. Bottom nav is
  hidden on this route (App.jsx NavLayout).

================================================================================

HOW IT MUST BEHAVE

- Rep math must match DB rules (INV_KARMA_01 / INV_KARMA_02): kredit only on
  verified completion, never on posting / requesting / accepting.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  pages/ProfileRep.jsx + utils/repPathModel.js + data/repLevels.js.
  Home redirects legacy `?rep` here.

================================================================================

GAPS TO WATCH

- Level thresholds live in data/repLevels.js; keep UI labels in sync.
