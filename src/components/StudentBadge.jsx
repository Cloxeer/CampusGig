import { GraduationCap } from "lucide-react";

/**
 * Small verified-NMSU-student marker shown to the right of a poster's name:
 * a green graduation cap inside a subtle gray circle for noticeability.
 * Outsiders (clients) render nothing — callers gate on the poster's type.
 */
export default function StudentBadge({ size = 12, style }) {
  const circle = Math.round(size * 1.7);
  return (
    <span
      role="img"
      aria-label="Verified NMSU student"
      title="Verified NMSU student"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: circle,
        height: circle,
        borderRadius: "50%",
        background: "var(--bg3)",
        border: "1px solid var(--bd)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.18)",
        flexShrink: 0,
        ...style,
      }}
    >
      <GraduationCap size={size} color="var(--green)" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
