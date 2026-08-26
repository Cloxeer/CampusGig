import { MapPin, Clock, Timer, Globe } from "lucide-react";
import LevelBadge from "./LevelBadge";
import StudentBadge from "./StudentBadge";
import Stars from "./Stars";
import UserAvatar from "./UserAvatar";
import { elapsed, countdown } from "../utils/helpers";

export default function GigCard({ gig, onClick, tick }) {
  const cd = gig.status === "completed" ? null : countdown(gig.deadline);

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
          {gig.isRemote ? <Globe size={10} /> : <MapPin size={10} />} {gig.loc}
        </span>
        {cd && !cd.expired ? (
          <span className="gmi" key={tick} style={{ color: "var(--amber)", fontWeight: 600 }}>
            <Timer size={10} /> {cd.text}
          </span>
        ) : gig.eta && gig.eta !== "—" ? (
          <span className="gmi">
            <Clock size={10} /> {gig.eta}
          </span>
        ) : null}
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
        <UserAvatar
          user={{
            id: gig.posterId,
            resolvedAvatarUrl: gig.avatarUrl,
            avatar_color: gig.color,
            first_name: gig.initials?.[0],
            last_name: gig.initials?.[1],
            equipped_border: gig.posterEquippedBorder,
          }}
          size="xs"
          style={{ marginTop: 1 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--fg3)" }}>
            {gig.poster}
            {gig.posterIsStudent ? <StudentBadge size={12} /> : null}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            {gig.posterReviewCount > 0 ? (
              <>
                <Stars rating={gig.posterAvgRating} size={9} />
                <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                  {gig.posterAvgRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                No reviews
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
            flexShrink: 0,
            maxWidth: "45%",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--fg4)",
              fontFamily: "var(--mono)",
            }}
            key={tick}
          >
            {elapsed(gig.postedAt)}
          </span>
          <LevelBadge label={gig.levelLabel} userId={gig.posterId} equippedTagId={gig.posterEquippedTag} small />
        </div>
      </div>
    </div>
  );
}
