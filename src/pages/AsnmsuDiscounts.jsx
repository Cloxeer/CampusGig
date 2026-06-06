import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, ExternalLink, IdCard } from "lucide-react";
import DiscountCard from "../components/asnmsu/DiscountCard";
import { ASNMSU_SOURCE_URL, getDiscountsByTier } from "../utils/asnmsuDiscounts";

const TOP_PICKS = getDiscountsByTier("top");
const MORE_DEALS = getDiscountsByTier("more");

function handleBack(navigate) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    navigate(-1);
  } else {
    navigate("/");
  }
}

export default function AsnmsuDiscounts() {
  const navigate = useNavigate();

  return (
    <div className="page fadein asnmsu-discounts">
      <header className="asnmsu-discounts__header">
        <button
          type="button"
          className="btn bg-btn bico"
          onClick={() => handleBack(navigate)}
          aria-label="Go back"
        >
          <span style={{ fontSize: 15 }}>←</span>
        </button>
        <div className="asnmsu-discounts__hero">
          <p className="asnmsu-discounts__eyebrow">
            <MapPin size={14} strokeWidth={2.5} aria-hidden />
            Las Cruces · NMSU students
          </p>
          <h1 className="asnmsu-discounts__title">Local for you</h1>
          <p className="asnmsu-discounts__lead">
            Real deals at spots Aggies already love — curated by ASNMSU, easy to use on CampusGig.
          </p>
          <div className="asnmsu-discounts__id-pill">
            <IdCard size={15} strokeWidth={2.25} aria-hidden />
            Show your <strong>NMSU student ID</strong> when you pay
          </div>
        </div>
      </header>

      <div className="scroll scroll--asnmsu-pad scroll--fine-scrollbar">
        <section className="asnmsu-discounts__section" aria-labelledby="top-picks-heading">
          <div className="asnmsu-discounts__section-head">
            <div>
              <h2 id="top-picks-heading" className="asnmsu-discounts__section-title">
                <Sparkles size={18} strokeWidth={2.25} aria-hidden />
                Top picks
              </h2>
              <p className="asnmsu-discounts__section-sub">
                20% off and up — brought to you by your local ASNMSU
              </p>
            </div>
          </div>
          <div className="asnmsu-discounts__grid asnmsu-discounts__grid--featured">
            {TOP_PICKS.map((deal, i) => (
              <DiscountCard
                key={deal.id}
                deal={deal}
                variant="featured"
                style={{ "--card-i": i }}
              />
            ))}
          </div>
        </section>

        <section className="asnmsu-discounts__section" aria-labelledby="more-deals-heading">
          <div className="asnmsu-discounts__section-head">
            <h2 id="more-deals-heading" className="asnmsu-discounts__section-title">
              More nearby deals
            </h2>
            <p className="asnmsu-discounts__section-sub">Still worth the drive — 10% off and student offers</p>
          </div>
          <div className="asnmsu-discounts__grid">
            {MORE_DEALS.map((deal, i) => (
              <DiscountCard key={deal.id} deal={deal} style={{ "--card-i": i + TOP_PICKS.length }} />
            ))}
          </div>
        </section>

        <footer className="asnmsu-discounts__footer">
          <p>
            Offers can change — double-check in store. CampusGig doesn&apos;t handle payments or verify discounts;
            ASNMSU partners set the terms.
          </p>
          <a
            className="asnmsu-discounts__source"
            href={ASNMSU_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View full list on ASNMSU
            <ExternalLink size={14} strokeWidth={2} aria-hidden />
          </a>
        </footer>
      </div>
    </div>
  );
}
