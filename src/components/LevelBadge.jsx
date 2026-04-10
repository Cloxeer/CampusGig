export default function LevelBadge({ label, small }) {
  const cls =
    { New: "lv-new", Reliable: "lv-reliable", Trusted: "lv-trusted", Legend: "lv-legend" }[label] ||
    "lv-new";

  return (
    <span className={`badge ${cls}`} style={{ fontSize: small ? 10 : 11 }}>
      {label}
    </span>
  );
}
