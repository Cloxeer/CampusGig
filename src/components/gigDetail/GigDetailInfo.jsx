import { MapPin, Clock, FileText, Timer, Calendar, CalendarCheck } from "lucide-react";
import GigDetailStatusBadge from "./GigDetailStatusBadge";
import { renderGigDescription } from "../../utils/gigDescriptionMarkup";

/** "Apr 10, 2026, 2:22 PM" — absolute event time, locale-aware. */
function fmtDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DetailRow({ icon, label, val, expired, preserveWhitespace }) {
  return (
    <div className="gig-detail-row">
      <div className={`gig-detail-row__icon${expired ? " gig-detail-row__icon--err" : ""}`}>{icon}</div>
      <div className="gig-detail-row__body">
        <div className="gig-detail-row__label">{label}</div>
        <div
          className={`gig-detail-row__val${expired ? " gig-detail-row__val--err" : ""}`}
          style={preserveWhitespace ? { whiteSpace: "pre-wrap", wordBreak: "break-word" } : undefined}
        >
          {preserveWhitespace ? renderGigDescription(val) : val}
        </div>
      </div>
    </div>
  );
}

export default function GigDetailInfo({ gig, model, tick }) {
  const { countdown: cd, taskDesc, categoryLabel, effectiveStatus, expired, priceDisplay } = model;

  return (
    <>
      <div className="gig-detail-header-block">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span className="gig-detail-cat-pill">{categoryLabel}</span>
          <GigDetailStatusBadge status={effectiveStatus} expired={expired} />
        </div>
        <div className="gig-detail-title">{gig.title}</div>
        <div className="gig-detail-price-row">
          <div className="gig-detail-price">{priceDisplay}</div>
          {model.isActive && !expired && (
            <span className="gig-detail-inline-status gig-detail-inline-status--active">Active</span>
          )}
          {model.isCompleted && (
            <span className="gig-detail-inline-status gig-detail-inline-status--done">Done</span>
          )}
        </div>
      </div>

      <div className="gig-detail-info-rows">
        {gig.location && (
          <DetailRow icon={<MapPin size={14} />} label="Location" val={gig.location} />
        )}
        {cd && (
          <DetailRow
            key={tick}
            icon={<Timer size={14} />}
            label={cd.expired ? "Time ended" : "Time remaining"}
            val={cd.expired ? "Deadline passed" : `⏱ ${cd.text}`}
            expired={cd.expired}
          />
        )}
        {!cd && model.estimatedTime && (
          <DetailRow icon={<Clock size={14} />} label="Est. time" val={model.estimatedTime} />
        )}
        {fmtDateTime(gig.created_at) && (
          <DetailRow icon={<Calendar size={14} />} label="Posted" val={fmtDateTime(gig.created_at)} />
        )}
        {model.isCompleted && fmtDateTime(gig.completed_at) && (
          <DetailRow icon={<CalendarCheck size={14} />} label="Completed" val={fmtDateTime(gig.completed_at)} />
        )}
        <DetailRow
          icon={<FileText size={14} />}
          label="Gig description"
          val={taskDesc}
          preserveWhitespace
        />
      </div>
    </>
  );
}
