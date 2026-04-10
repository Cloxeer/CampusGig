import { MapPin, Clock, FileText, Lock, CheckCircle, Check } from "lucide-react";
import LevelBadge from "../LevelBadge";
import Stars from "../Stars";
import { elapsed } from "../../utils/helpers";

export default function GigDetailModal({ gig, tick, requested, onRequest, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet slidein" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />

        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd)" }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: "var(--fg)", lineHeight: 1.4, marginBottom: 8 }}>
            {gig.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--mono)", letterSpacing: "-.04em" }}>
              {gig.price}
            </span>
            <span style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)" }} key={tick}>
              {elapsed(gig.postedAt)}
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: <MapPin size={14} />, label: "Location", val: gig.loc },
            { icon: <Clock size={14} />, label: "Est. time", val: gig.eta },
            { icon: <FileText size={14} />, label: "Notes", val: gig.notes },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r)",
                  background: "var(--bg3)",
                  border: "1px solid var(--bd)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--fg3)",
                }}
              >
                {r.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 1 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 14, color: "var(--fg)" }}>{r.val}</div>
              </div>
            </div>
          ))}

          {/* Poster */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 6 }}>
              Posted by
            </div>
            <div
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--bd)",
                borderRadius: "var(--r)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: gig.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {gig.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{gig.poster}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <LevelBadge label={gig.levelLabel} />
                  <Stars n={5} size={11} filled />
                  <span style={{ fontSize: 11, color: "var(--fg3)" }}>4.8</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--amber-bg)",
              border: "1px solid var(--amber-bd)",
              borderRadius: "var(--r)",
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--amber)",
            }}
          >
            <Lock size={13} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--mono)" }}>Payment details shared only after both parties accept.</span>
          </div>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {!requested ? (
            <button className="btn bgreen bfull blg" onClick={onRequest}>
              <CheckCircle size={16} /> Accept this gig
            </button>
          ) : (
            <div className="callout" style={{ background: "var(--green-bg)", borderColor: "var(--green-bd)" }}>
              <div className="ci" style={{ color: "var(--green-d)" }}>
                <Check size={13} />
              </div>
              <span className="ct" style={{ color: "var(--green-text)" }}>
                <strong>Request sent!</strong> {gig.poster} will confirm and payment details will be shared.
              </span>
            </div>
          )}
          <button className="btn bo bfull" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
