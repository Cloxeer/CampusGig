import { createElement } from "react";
import { CheckCircle, Star, Package, Timer } from "lucide-react";
import { parseDeadline } from "../../../lib/profile";

export function buildProfileActivityItems(activity) {
  return [
    ...activity.completedGigs.map((g) => ({
      icon: createElement(CheckCircle, { size: 15 }),
      t: `${g.category?.label || "Gig"} completed`,
      s: `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""} · $${Number(g.price).toFixed(2)}`,
      d: "+10 pts",
      pos: true,
      time: new Date(g.updated_at).getTime(),
      gigId: g.id,
    })),
    ...activity.receivedReviews.map((r) => {
      const rounded = Math.round(r.rating);
      const isZero = rounded === 0;
      return {
        icon: createElement(Star, { size: 15 }),
        t: `${r.rating}-star review received`,
        s: `From ${r.reviewer?.first_name || "User"} — "${r.text?.slice(0, 30)}${r.text?.length > 30 ? "…" : ""}"`,
        d: isZero ? "-10 pts" : `+${rounded} pts`,
        pos: !isZero,
        time: new Date(r.created_at).getTime(),
        gigId: null,
        reviewerId: r.reviewer_id || null,
      };
    }),
    ...activity.postedGigs.map((g) => {
      const dl = parseDeadline(g);
      const isExpired = dl && dl < Date.now();
      const takerName = g.taker ? `${g.taker.first_name || ""} ${g.taker.last_name || ""}`.trim() : null;

      let statusLabel, subtitle;
      const titleSnip = `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""}`;

      if (g.status === "completed" && takerName) {
        statusLabel = "Done";
        subtitle = `${titleSnip} · Done by ${takerName}`;
      } else if (g.status === "active" && takerName) {
        statusLabel = isExpired ? "Time ended" : "Active";
        subtitle = `${titleSnip} · Taken by ${takerName}`;
      } else if (g.status === "active" && isExpired) {
        statusLabel = "Time ended";
        subtitle = `${titleSnip} · Time ended`;
      } else if (g.status === "open" && isExpired) {
        statusLabel = "Expired";
        subtitle = `${titleSnip} · Expired — no takers`;
      } else {
        statusLabel = g.status === "open" ? "Open" : g.status;
        subtitle = `${titleSnip} · ${statusLabel}`;
      }

      return {
        icon:
          isExpired && g.status !== "completed"
            ? createElement(Timer, { size: 15 })
            : createElement(Package, { size: 15 }),
        t: `${g.category?.label || "Gig"} posted`,
        s: subtitle,
        d: statusLabel,
        pos: g.status === "completed",
        expired: isExpired && g.status !== "completed",
        time: new Date(g.created_at).getTime(),
        gigId: g.id,
      };
    }),
  ].sort((a, b) => b.time - a.time);
}
