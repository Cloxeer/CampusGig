import { buildContactRows, splitContactRows } from "../../utils/contactDisplay";

function bindRowEl(rowEls, key) {
  return (el) => {
    if (!rowEls) return;
    if (el) rowEls.current[key] = el;
    else delete rowEls.current[key];
  };
}

function ContactRow({ row, rowEls, first }) {
  const className = `gig-detail-contact-row${first ? " gig-detail-contact-row--first" : ""}`;
  const inner = (
    <>
      <span className="gig-detail-contact-row__label">{row.label}</span>
      <span className="gig-detail-contact-row__val">{row.value}</span>
    </>
  );
  const ref = bindRowEl(rowEls, row.key);
  if (row.href) {
    return (
      <a ref={ref} className={className} href={row.href} data-contact-key={row.key}>
        {inner}
      </a>
    );
  }
  return (
    <div ref={ref} className={className} data-contact-key={row.key}>
      {inner}
    </div>
  );
}

function ContactGroup({ title, rows, rowEls }) {
  if (!rows.length) return null;
  return (
    <div className="gig-detail-contact-group">
      {title ? <div className="gig-detail-contact-group__title">{title}</div> : null}
      <div className="gig-detail-contact-list">
        {rows.map((row, i) => (
          <ContactRow key={row.key} row={row} rowEls={rowEls} first={i === 0} />
        ))}
      </div>
    </div>
  );
}

function PersonContactCard({ user, name, rowEls }) {
  const { message, pay } = splitContactRows(buildContactRows(user));
  if (!message.length && !pay.length) return null;
  return (
    <div className="gig-detail-contact-card">
      <div className="gig-detail-contact-card__name">{name}</div>
      <ContactGroup title="Contact" rows={message} rowEls={rowEls} />
      <ContactGroup title="Pay" rows={pay} rowEls={rowEls} />
    </div>
  );
}

function SharedContactCard({ user, rowEls }) {
  const { message, pay } = splitContactRows(buildContactRows(user));
  if (!message.length && !pay.length) return null;
  return (
    <div className="gig-detail-contact-card gig-detail-contact-card--quiet">
      <div className="gig-detail-contact-card__name">Visible to them</div>
      <ContactGroup title="Contact" rows={message} rowEls={rowEls} />
      <ContactGroup title="Pay" rows={pay} rowEls={rowEls} />
    </div>
  );
}

export default function GigDetailContacts({ model, otherRowEls, ownRowEls }) {
  const { showContactInfo, role, poster, requesterUser } = model;
  if (!showContactInfo) return null;

  const other = role === "requester" ? poster : requesterUser;
  const self = role === "requester" ? requesterUser : poster;
  const otherName = other?.first_name || (role === "requester" ? "Poster" : "Them");

  return (
    <div className="gig-detail-contacts">
      {other ? <PersonContactCard user={other} name={otherName} rowEls={otherRowEls} /> : null}
      {self ? <SharedContactCard user={self} rowEls={ownRowEls} /> : null}
    </div>
  );
}
