import { Zap } from "lucide-react";

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

export function LogoMark() {
  return (
    <div className="tmark">
      <Zap size={14} color="#fff" strokeWidth={2.5} />
    </div>
  );
}
