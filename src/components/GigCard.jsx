import { MapPin, Clock } from "lucide-react";
import LevelBadge from "./LevelBadge";
import Stars from "./Stars";
import { elapsed } from "../utils/helpers";

export default function GigCard({ gig, onClick, tick }) {
  return (
    <div className="gig" onClick={onClick}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg)",
            lineHeight: 1.45,
            letterSpacing: "-.01em",
            flex: 1,
          }}
        >
          {gig.title}
        </span>
        <span className="gprice">{gig.price}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 9,
        }}
      >
        <span className="gmi">
          <MapPin size={10} /> {gig.loc}
        </span>
        <span className="gmi">
          <Clock size={10} /> {gig.eta}
        </span>
        <span className="badge bn">{gig.cat}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          paddingTop: 9,
          borderTop: "1px solid var(--bd)",
        }}
      >
        {gig.avatarUrl ? (
          <img
            src={gig.avatarUrl}
            alt=""
            style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 1 }}
          />
        ) : (
          <div className="pav" style={{ background: gig.color, marginTop: 1 }}>
            {gig.initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "var(--fg3)" }}>
            {gig.poster}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Stars rating={gig.posterAvgRating} size={9} />
            {gig.posterReviewCount > 0 ? (
              <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                {gig.posterAvgRating.toFixed(1)}
              </span>
            ) : (
              <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                No reviews
              </span>
            )}
          </div>
        </div>
        <LevelBadge label={gig.levelLabel} small />
        <span
          style={{
            fontSize: 10,
            color: "var(--fg4)",
            fontFamily: "var(--mono)",
            marginTop: 2,
          }}
          key={tick}
        >
          {elapsed(gig.postedAt)}
        </span>
      </div>
    </div>
  );
}
