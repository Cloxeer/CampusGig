import { Bell } from "lucide-react";

export default function AlertsEmptyState() {
  return (
    <div style={{ padding: "48px 16px", textAlign: "center" }}>
      <Bell size={28} color="var(--fg4)" style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 4 }}>
        No alerts yet
      </div>
      <div style={{ fontSize: 12, color: "var(--fg4)" }}>
        You'll see notifications here when something happens.
      </div>
    </div>
  );
}
