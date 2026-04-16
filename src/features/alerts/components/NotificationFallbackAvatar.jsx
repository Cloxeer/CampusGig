import { Bell, Star, AlertTriangle } from "lucide-react";

function fallbackForType(type) {
  if (type === "review") {
    return { bg: "#fefce8", color: "#ca8a04", icon: <Star size={16} /> };
  }
  if (type === "issue") {
    return { bg: "#fef2f2", color: "#dc2626", icon: <AlertTriangle size={16} /> };
  }
  return { bg: "#f4f4f5", color: "#71717a", icon: <Bell size={16} /> };
}

export default function NotificationFallbackAvatar({ type }) {
  const fb = fallbackForType(type);
  return (
    <div className="aico" style={{ background: fb.bg, color: fb.color }}>
      {fb.icon}
    </div>
  );
}
