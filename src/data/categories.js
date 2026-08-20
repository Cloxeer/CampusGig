/**
 * Single source of truth for gig categories — imported by PostGig (the picker),
 * Home (the filter tabs), and the draft validator. Add/rename a category HERE
 * and every surface follows, so the picker and the filter can never drift.
 *
 * IMPORTANT: `label` must match a row in the Supabase `categories` table exactly
 * — posting looks up category_id by this label (see src/lib/gigs.js). When you
 * change a label here, run the matching SQL against the `categories` table.
 *
 * Deliberately BROAD umbrellas: the title/description carries the specifics, and
 * "Other" is always available, so no one is ever locked out of posting.
 * `icon` is a lucide icon name; `hint` seeds the picker's example text.
 */
export const CATEGORIES = [
  { label: "Delivery", icon: "Bike", hint: "food & coffee runs, pickups, drop-offs" },
  { label: "Errands", icon: "Package", hint: "moving help, wait in line, setup, rides" },
  { label: "Academics", icon: "GraduationCap", hint: "tutoring, notes, printing, proofreading" },
  { label: "Creative", icon: "Sparkles", hint: "design, coding, writing, video, social" },
  { label: "Other", icon: "MessageCircle", hint: "anything else" },
];

/** All category labels, in order. */
export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

/** The catch-all category — always a valid fallback. */
export const FALLBACK_CATEGORY = "Other";

/** Labels that make sense as browse filters (Other folds into "All"). */
export const FILTERABLE_CATEGORY_LABELS = CATEGORY_LABELS.filter((l) => l !== FALLBACK_CATEGORY);
