import { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

/**
 * Redirect legacy `?gig=<id>` query param to `/gig/:id`.
 * @param {string} returnPath - fallback pathname when building returnTo after stripping `gig`
 * @param {{ enabled?: boolean, skipWhenReviews?: boolean }} [options]
 */
export function useLegacyGigRedirect(returnPath, options = {}) {
  const { enabled = true, skipWhenReviews = false } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!enabled) return;
    if (skipWhenReviews && searchParams.get("reviews") === "1") return;
    const legacy = searchParams.get("gig");
    if (!legacy) return;
    const next = new URLSearchParams(searchParams);
    next.delete("gig");
    const qs = next.toString();
    const resolvedReturn =
      `${location.pathname}${qs ? `?${qs}` : ""}` || returnPath;
    navigate(`/gig/${legacy}`, { replace: true, state: { returnTo: resolvedReturn } });
  }, [enabled, skipWhenReviews, searchParams, navigate, location.pathname, returnPath]);
}
