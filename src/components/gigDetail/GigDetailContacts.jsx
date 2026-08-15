import { buildContactRows } from "../../utils/contactDisplay";

function ContactBlock({ user, label }) {
  const rows = buildContactRows(user);
  if (rows.length === 0) return null;

  return (
    <div className="gig-detail-contact-block">
      <div className="gig-detail-section-label">{label}'s info</div>
      <div className="gig-detail-contact-list">
        {rows.map((row, i) => (
          <div key={row.key} className="gig-detail-contact-row" style={{ borderTop: i > 0 ? undefined : "none" }}>
            <div className="gig-detail-contact-row__label">{row.label}</div>
            <div className="gig-detail-contact-row__val">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GigDetailContacts({ model }) {
  const { showContactInfo, role, poster, requesterUser } = model;
  if (!showContactInfo) return null;

  return (
    <div className="gig-detail-contacts">
      <div className="gig-detail-section-label">Get in Touch</div>
      {role === "requester" && poster && (
        <ContactBlock user={poster} label={poster.first_name || "Poster"} />
      )}
      {role === "poster" && requesterUser && (
        <ContactBlock user={requesterUser} label={requesterUser.first_name || "Taker"} />
      )}
      {role === "requester" && requesterUser && (
        <ContactBlock user={requesterUser} label="Your info (shared)" />
      )}
      {role === "poster" && poster && (
        <ContactBlock user={poster} label="Your info (shared)" />
      )}
    </div>
  );
}
