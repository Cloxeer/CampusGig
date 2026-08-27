/**
 * Routes available after sign-in (main app shell). Used for bug report "where did you see this?"
 * Keep in sync with `App.jsx` session routes.
 */
export const BUG_REPORT_PAGE_OPTIONS = [
  { path: "/", label: "Home" },
  { path: "/explore", label: "Explore" },
  { path: "/post", label: "Post a gig" },
  { path: "/alerts", label: "Alerts" },
  { path: "/profile", label: "My profile" },
  { path: "/profile/:userId", label: "Another student's profile" },
  { path: "/profile/edit", label: "Edit profile" },
  { path: "/settings", label: "Settings" },
  { path: "/app-intro", label: "Onboarding tutorial" },
  { path: "/welcome/how-it-works", label: "How it works" },
  { path: "/gig/:gigId", label: "Gig detail" },
  { path: "/terms", label: "Terms of service" },
  { path: "/privacy", label: "Privacy policy" },
];

/**
 * Map current location to the canonical option `path` for the bug report dropdown.
 */
export function bugReportPathFromLocation(pathname) {
  if (!pathname) return "";
  if (/^\/gig\/[^/]+$/.test(pathname)) return "/gig/:gigId";
  if (pathname === "/welcome/how-it-works" || pathname.startsWith("/welcome/how-it-works")) return "/welcome/how-it-works";
  if (/^\/profile\/[^/]+$/.test(pathname)) return "/profile/:userId";
  const exact = BUG_REPORT_PAGE_OPTIONS.some((o) => o.path === pathname);
  if (exact) return pathname;
  return "";
}
