import LevelBadge from "../LevelBadge";
import UserAvatar from "../UserAvatar";
import { getLevel } from "../../utils/helpers";

function PersonCard({ user, label, onClick }) {
  if (!user) return null;
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const lvl = getLevel(user.rep_score || 0);

  return (
    <button type="button" className="gig-detail-person-card" onClick={onClick}>
      <UserAvatar user={user} size="lg" style={{ border: "2px solid var(--bd)" }} />
      <div className="gig-detail-person-card__name">{name}</div>
      <div className="gig-detail-person-card__role">{label}</div>
      <LevelBadge label={lvl.label} userId={user.id} />
      <div className="gig-detail-person-card__link">View Profile ›</div>
    </button>
  );
}

function PosterRow({ poster, posterName, posterLevel, onClick }) {
  return (
    <div className="gig-detail-poster-row" onClick={onClick} role="button" tabIndex={0}>
      <UserAvatar user={poster} size={40} />
      <div style={{ flex: 1 }}>
        <div className="gig-detail-poster-row__name">{posterName}</div>
        <LevelBadge label={posterLevel.label} userId={poster?.id} />
      </div>
      <span style={{ fontSize: 14, color: "var(--fg4)" }}>›</span>
    </div>
  );
}

export default function GigDetailPeople({ model, onViewProfile }) {
  const { poster, requesterUser, phase, requesterLabel, showNoRequestersYet } = model;

  if (phase === "discover") {
    return (
      <div className="gig-detail-people">
        <div className="gig-detail-section-label">Posted by</div>
        <PosterRow
          poster={poster}
          posterName={model.posterName}
          posterLevel={model.posterLevel}
          onClick={() => onViewProfile(poster.id)}
        />
      </div>
    );
  }

  return (
    <div className="gig-detail-people">
      <div className="gig-detail-section-label">People</div>
      <div className="gig-detail-people-grid">
        <PersonCard user={poster} label="Posted" onClick={() => onViewProfile(poster.id)} />
        {requesterUser && (
          <PersonCard
            user={requesterUser}
            label={requesterLabel}
            onClick={() => onViewProfile(requesterUser.id)}
          />
        )}
      </div>
      {showNoRequestersYet && (
        <div className="gig-detail-empty-hint">No one has requested this gig yet.</div>
      )}
    </div>
  );
}
