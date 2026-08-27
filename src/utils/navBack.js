/** Prefer real history when this session pushed at least one entry (React Router `idx`). */
export function navigateBack(navigate, fallback = "/") {
  const idx = window.history.state?.idx;
  if (typeof idx === "number" && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
