import { releaseStageLabel } from "../data/releaseStage";

/* High-res mark (not the 32px favicon — that blurs at 52px). */
export const LOGO_MARK_SRC = "/photos/logo-mark.png";

function cssLen(size, fallback = "15px") {
  if (size == null) return fallback;
  return typeof size === "number" ? `${size}px` : size;
}

export default function Logo({ size = 15, stageRef }) {
  const stage = releaseStageLabel();
  const len = cssLen(size);
  return (
    <span className="logo-wordmark" style={{ "--logo-size": len }}>
      <span
        className="logo-wordmark-name"
        style={{
          fontSize: "var(--logo-size)",
          fontWeight: 700,
          letterSpacing: "-.04em",
          color: "var(--fg)",
        }}
      >
        GetCampus<span style={{ color: "var(--green)" }}>Gig</span>.com
      </span>
      {stage ? (
        <span ref={stageRef} className="logo-stage" aria-label={stage}>
          {stage}
        </span>
      ) : null}
    </span>
  );
}

export function LogoMark({ size, style, className = "tmark" }) {
  const dim = size == null ? undefined : size;
  return (
    <div
      className={className}
      style={dim != null ? { width: dim, height: dim, ...style } : style}
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
  lockupRef,
  stageRef,
}) {
  return (
    <div className={className} ref={lockupRef}>
      <LogoMark size={markSize} style={markStyle} />
      <Logo size={logoSize} stageRef={stageRef} />
    </div>
  );
}
