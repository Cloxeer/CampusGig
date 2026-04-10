import { Star as StarIcon } from "lucide-react";

export default function Stars({ n = 5, size = 12, filled = false }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          size={size}
          fill={i <= n && filled ? "#fbbf24" : "none"}
          color={i <= n ? "#fbbf24" : "#d4d4d8"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
