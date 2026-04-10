import { Star as StarIcon } from "lucide-react";

export default function Stars({ rating = 0, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const diff = rating - i;
        const fillPct = diff >= 1 ? 100 : diff > 0 ? Math.round(diff * 100) : 0;

        if (fillPct === 100) {
          return <StarIcon key={i} size={size} fill="#fbbf24" color="#fbbf24" strokeWidth={1.5} />;
        }
        if (fillPct === 0) {
          return <StarIcon key={i} size={size} fill="none" color="#d4d4d8" strokeWidth={1.5} />;
        }

        return (
          <span key={i} style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
            <StarIcon size={size} fill="none" color="#d4d4d8" strokeWidth={1.5} />
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${fillPct}%`,
                height: "100%",
                overflow: "hidden",
              }}
            >
              <StarIcon size={size} fill="#fbbf24" color="#fbbf24" strokeWidth={1.5} style={{ minWidth: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
