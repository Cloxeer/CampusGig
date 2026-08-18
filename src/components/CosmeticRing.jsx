/**
 * CosmeticRing — the SINGLE renderer for an equipped avatar border.
 *
 * Everything that shows a border composes THIS: real avatars (UserAvatar), the
 * inventory swatch, the live preview, the prize reveal. One definition of the
 * ring band, the animated fill, and the art overlay, so a border looks
 * identical everywhere and a NEW border "just works" from its catalog fields.
 *
 * The ring sits OUTSIDE the photo: the content keeps its full `size`, and the
 * band wraps around it (the photo never shrinks when you equip a border). The
 * wrapper's layout footprint stays `size`, so the band overflows outward like a
 * halo without reflowing neighbours.
 *
 * Layer order (bottom → top):
 *   1. ring fill — a `ring` disc extended `band` past the photo on every side,
 *                  BEHIND the (opaque) photo, so only the outer band shows.
 *   2. children  — the photo / initials / hole, at full `size`.
 *   3. art       — optional frame drawing (Clouds, Glitch bars), spilling past
 *                  the band. `artFx` animates the art itself.
 *
 * Everything is proportional to `size`, so a 26px swatch is a faithful
 * miniature of a 62px avatar — same band thickness, glow, and art overshoot.
 *
 * @param {object}  cosmetic  a `type: "border"` entry (ring, fx?, glow?, dur?, art?, artFx?)
 * @param {number}  size      photo diameter in px (the ring adds `band` outside it)
 * @param {node}    children  what sits inside the ring (fills the content circle)
 * @param {object} [style]    extra styles merged onto the outer wrapper
 */
export default function CosmeticRing({ cosmetic, size, children, style }) {
  const band = Math.max(2, Math.round(size * 0.08)); // ring thickness, OUTSIDE the photo
  const glowR = Math.max(4, Math.round(size * 0.16)); // halo radius, scaled
  const artInset = Math.round(size * 0.16); // art box = photo + band + a little overshoot

  return (
    <span
      style={{
        position: "relative",
        display: "inline-grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        aria-hidden
        className={cosmetic.fx ? `bfx bfx--${cosmetic.fx}` : undefined}
        style={{
          position: "absolute",
          inset: `-${band}px`,
          borderRadius: "50%",
          background: cosmetic.ring,
          "--bfx-glow-r": `${glowR}px`,
          ...(cosmetic.glow ? { "--bfx-glow": cosmetic.glow } : null),
          ...(cosmetic.dur ? { "--bfx-dur": cosmetic.dur } : null),
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          /* A single firm track so the content circle is an exact square in
             EVERY engine. WebKit won't resolve an <img>'s `height:100%` against
             a grid item sized only by a percentage chain — it falls back to the
             image's intrinsic (often portrait) aspect and the photo turns oval,
             leaking the ring disc out the sides. `aspect-ratio` + `min-*: 0`
             give it a real, width-derived height so that can't happen. */
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          width: "100%",
          height: "100%",
          aspectRatio: "1 / 1",
          minWidth: 0,
          minHeight: 0,
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {children}
      </span>
      {/* Multi-part frames (e.g. Clouds: a top band + a bottom band placed and
          sized independently). Each layer's `style` positions it relative to the
          size×size wrapper, so percentages keep it a faithful miniature at any
          size. Falls back to the single `art` overlay for one-piece frames. */}
      {cosmetic.artLayers
        ? cosmetic.artLayers.map((layer, i) => (
            <span
              key={i}
              aria-hidden
              /* A layer opts out of the shared artFx with `noFx` (e.g. a static
                 glow that shouldn't sway with the drawn art). */
              className={cosmetic.artFx && !layer.noFx ? `bfx--${cosmetic.artFx}` : undefined}
              style={{
                position: "absolute",
                zIndex: 2,
                pointerEvents: "none",
                /* `url` layers are drawn art; a layer without one is pure CSS
                   (e.g. a gradient glow) styled entirely via `style`. */
                ...(layer.url
                  ? { backgroundImage: `url("${layer.url}")`, backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }
                  : null),
                ...layer.style,
              }}
            />
          ))
        : cosmetic.art
          ? (
            <span
              aria-hidden
              className={cosmetic.artFx ? `bfx--${cosmetic.artFx}` : undefined}
              style={{
                position: "absolute",
                inset: `-${artInset}px`,
                zIndex: 2,
                backgroundImage: `url("${cosmetic.art}")`,
                backgroundSize: "100% 100%",
                pointerEvents: "none",
              }}
            />
          )
          : null}
    </span>
  );
}
