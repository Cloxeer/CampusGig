# Alerts

**Route:** `/alerts`

================================================================================

WHAT IT IS

  Inbox of notifications from OTHER people’s actions on YOUR stuff.
  Examples: someone requested your gig, accepted, rejected, completed, reviewed you.
  Tap row → detail modal that shows gig context when relevant.

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav bell. Unread dot when count > 0.

================================================================================

TLA+ IN CAVEMAN

  vars: notif_list  profile_map  read_state  grouped_keys

  INIT: fetch notifications for current user id

  on_mount → mark read (or on open — follow existing code)

  realtime → INSERT on notifications for me → bump unread in App + refresh list

  tap_row → open AlertDetailModal with notification or gig id

  swipe_delete (if implemented) → delete row

================================================================================

HOW IT MUST BEHAVE

- Avatar on the left = the OTHER person in the story (not me).
- Same gig spam should feel grouped (code groups “gig requested” bursts).
- Nothing here replaces Profile “Activity” — Activity is MY timeline; Alerts is inbox.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Alerts.jsx + getProfilesByIds for avatars + AlertDetailModal.
  currentUserId passed from App.

================================================================================

GAPS TO WATCH

- Ordering: newest first.
- If DB sends bad metadata, UI should fallback to icon — not crash.
