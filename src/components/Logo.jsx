import { releaseStageLabel } from "../data/releaseStage";

/* PNG, not the multi-size .ico — .ico renders unreliably in an inline <img>. */
export const LOGO_MARK_SRC = "/photos/favicon-32x32.png";

export default function Logo({ size = 15 }) {
  const stage = releaseStageLabel();
  return (
    <span className="logo-wordmark" style={{ "--logo-size": `${size}px` }}>
      <span
        className="logo-wordmark-name"
        style={{
          fontSize: size,
          fontWeight: 700,
          letterSpacing: "-.04em",
          color: "var(--fg)",
        }}
      >
        GetCampus<span style={{ color: "var(--green)" }}>Gig</span>.com
      </span>
      {stage ? (
        <span className="logo-stage" aria-label={stage}>
          {stage}
        </span>
      ) : null}
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

/** Mark + wordmark (+ stage). One lockup for splash, topbars, sidebar. */
export function BrandLockup({
  markSize,
  logoSize = 15,
  className = "tlogo",
  markStyle,
}) {
  return (
    <div className={className}>
      <LogoMark size={markSize} style={markStyle} />
      <Logo size={logoSize} />
    </div>
  );
}
