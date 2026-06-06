import { MapPin, Phone, Navigation } from "lucide-react";
import DiscountPlaceholder from "./DiscountPlaceholder";
import { formatPhone, mapsUrl, telUrl } from "../../utils/asnmsuDiscounts";

export default function DiscountCard({ deal, variant = "compact", style }) {
  const isFeatured = variant === "featured";

  return (
    <article
      className={`discount-card${isFeatured ? " discount-card--featured" : ""}`}
      style={style}
    >
      <DiscountPlaceholder name={deal.name} category={deal.category} />

      <div className="discount-card__body">
        <div className="discount-card__top">
          <span className="discount-card__badge">{deal.discountLabel}</span>
          <span className="badge bn">{deal.category}</span>
        </div>

        <h3 className="discount-card__name">{deal.name}</h3>

        {deal.hoursNote ? <p className="discount-card__note">{deal.hoursNote}</p> : null}

        {deal.address ? (
          <p className="discount-card__addr">
            <MapPin size={12} strokeWidth={2} aria-hidden />
            <span>{deal.address}</span>
          </p>
        ) : null}

        <div className="discount-card__actions">
          <a
            className="btn bsm bgreen discount-card__action"
            href={mapsUrl(deal.mapsQuery)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation size={13} strokeWidth={2.5} />
            Directions
          </a>
          {deal.phone ? (
            <a className="btn bsm bo discount-card__action" href={telUrl(deal.phone)}>
              <Phone size={13} strokeWidth={2} />
              {formatPhone(deal.phone)}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
