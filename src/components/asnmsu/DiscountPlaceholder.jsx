/** Soft branded placeholder until partner photos are added. */
export default function DiscountPlaceholder({ name, category }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);

  const hues = [145, 330, 210, 25, 95];
  const hue = hues[Math.abs(hash) % hues.length];

  return (
    <div
      className="discount-card__media"
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 42% 94%) 0%, hsl(${hue} 28% 88%) 100%)`,
      }}
      aria-hidden
    >
      <span className="discount-card__media-initial">{initial}</span>
      {category ? <span className="discount-card__media-cat">{category}</span> : null}
    </div>
  );
}
