import { Lock } from "lucide-react";

export default function GigDetailLockCallout({ message }) {
  return (
    <div className="callout gig-detail-lock-callout">
      <Lock size={13} style={{ flexShrink: 0 }} />
      <span className="ct" style={{ fontFamily: "var(--mono)" }}>{message}</span>
    </div>
  );
}
