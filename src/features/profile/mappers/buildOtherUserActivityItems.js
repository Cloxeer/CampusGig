import { createElement } from "react";
import { CheckCircle, Package, Timer } from "lucide-react";
import { parseDeadline } from "../../../lib/profile";

/** Activity rows for someone else's profile (posted + completed gigs only; matches legacy UserProfile). */
export function buildOtherUserActivityItems(userActivity) {
  const posted = userActivity?.postedGigs ?? [];
  const completed = userActivity?.completedGigs ?? [];
  return [
    ...completed.map((g) => ({
      icon: createElement(CheckCircle, { size: 15 }),
      t: `${g.category?.label || "Gig"} completed`,
      s: `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""} · $${Number(g.price).toFixed(2)}`,
      d: "completed",
      pos: true,
      expired: false,
      time: new Date(g.updated_at).getTime(),
      gigId: g.id,
    })),
    ...posted.map((g) => {
      const dl = parseDeadline(g);
      const timeEnded = dl && dl < Date.now();
      let statusLabel = g.status === "open" ? "open" : g.status;
      if (timeEnded && g.status === "open") statusLabel = "Time ended";
      const takerName = g.taker ? `${g.taker.first_name || ""} ${g.taker.last_name || ""}`.trim() : null;
      let subtitle = `${g.title?.slice(0, 40)}${g.title?.length > 40 ? "…" : ""}`;
      if (takerName && (g.status === "active" || g.status === "completed")) {
        subtitle += ` · ${g.status === "active" ? "Taken by" : "Done by"} ${takerName}`;
      } else {
        subtitle += ` · ${statusLabel}`;
      }
      return {
        icon: timeEnded ? createElement(Timer, { size: 15 }) : createElement(Package, { size: 15 }),
        t: `${g.category?.label || "Gig"} posted`,
        s: subtitle,
        d: statusLabel,
        pos: false,
        expired: timeEnded,
        time: new Date(g.created_at).getTime(),
        gigId: g.id,
      };
    }),
  ].sort((a, b) => b.time - a.time);
}
