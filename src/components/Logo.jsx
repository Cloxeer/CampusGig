export const LOGO_MARK_SRC = "/photos/favicon.ico";

export default function Logo({ size = 15 }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-.04em",
        color: "var(--fg)",
      }}
    >
      Campus<span style={{ color: "var(--green)" }}>Gig</span>
    </span>
  );
}

export function LogoMark({ size, style, className = "tmark" }) {
  return (
    <div
      className={className}
      style={size != null ? { width: size, height: size, ...style } : style}
    >
      <img src={LOGO_MARK_SRC} alt="" className="tmark-img" draggable={false} />
    </div>
  );
}
