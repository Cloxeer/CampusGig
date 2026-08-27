import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function resetScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll(".scroll, .page, .shell-view").forEach((el) => {
    el.scrollTop = 0;
  });
}

/** New path → start at the top. Query-only changes (tabs, search, steps) keep scroll. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    resetScroll();
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      resetScroll();
      inner = requestAnimationFrame(resetScroll);
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pathname]);

  return null;
}
