import { useState } from "react";
import { X, Loader, Gift, Check } from "lucide-react";
import { COSMETICS, RARITIES } from "../data/cosmetics";
import { redeemCode } from "../lib/redeem";
import { equipCosmetic } from "../lib/cosmeticsInventory";
import { TagBadge } from "./EquippedTagBadge";
import CosmeticRing from "./CosmeticRing";

/** Human copy for each non-success outcome the RPC can return. */
const FAIL_COPY = {
  invalid: "That code isn’t valid. Double-check it and try again.",
  expired: "This code has expired.",
  depleted: "This code has been fully claimed.",
  already_redeemed: "You’ve already redeemed this code.",
  error: "Something went wrong. Please try again.",
};

/**
 * Redeem a fundraiser / promo code for a cosmetic. Server-authoritative: the
 * grant happens in the redeem_code RPC; on success we reveal the prize using the
 * SAME CosmeticRing / TagBadge every other surface uses (no bespoke reward art).
 */
export default function RedeemModal({ onClose }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fail, setFail] = useState(null); // status string | null
  const [won, setWon] = useState(null); // { cosmetic, dup } | null
  const [equipped, setEquipped] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setFail(null);
    const res = await redeemCode(code);
    setSubmitting(false);

    if (res.status === "ok") {
      const cosmetic = COSMETICS.find((c) => c.id === res.cosmetic_id) || null;
      setWon({ cosmetic, dup: !!res.dup });
      return;
    }
    setFail(res.status || "error");
  }

  const cosmetic = won?.cosmetic;
  /* Border rings draw decoration (clouds, glow, sway) that overflows well past
     their box — up to ~26% on every side. Reserve room around the preview so it
     never collides with the header above or the name below. */
  const isBorder = cosmetic?.type === "border";

  return (
    <div className="modal-center-root" onClick={onClose}>
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-center-hd">
          <div className="modal-center-hd-title">
            <Gift size={15} color="var(--fg3)" aria-hidden />
            <span>{won ? "Reward unlocked" : "Redeem a code"}</span>
          </div>
          <button type="button" className="modal-center-close" onClick={onClose} aria-label="Close">
            <X size={13} />
          </button>
        </div>

        {won ? (
          /* ---------- Success: reveal the prize ---------- */
          <div className="modal-center-body" style={{ padding: "10px 20px 4px", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: isBorder ? 22 : 2,
                marginBottom: isBorder ? 28 : 12,
              }}
            >
              {cosmetic?.type === "border" ? (
                <CosmeticRing cosmetic={cosmetic} size={76}>
                  <span
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "var(--bg2)",
                    }}
                  />
                </CosmeticRing>
              ) : cosmetic?.type === "tag" ? (
                <TagBadge cosmetic={cosmetic} />
              ) : (
                <Gift size={48} color="var(--fg3)" aria-hidden />
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {cosmetic?.name || "Reward"}
            </div>
            {cosmetic ? (
              <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)", marginTop: 3 }}>
                {RARITIES[cosmetic.rarity]?.label || cosmetic.rarity}
                {cosmetic.type === "border" ? " border" : cosmetic.type === "tag" ? " tag" : ""}
              </div>
            ) : null}
            <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, marginTop: 10 }}>
              {won.dup
                ? "You already owned this — it’s safely in your inventory."
                : "Added to your inventory. Equip it now or from your inventory anytime."}
            </div>
          </div>
        ) : (
          /* ---------- Entry: type a code ---------- */
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "2px 20px 4px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.5 }}>
              Got a code from a CampusGig fundraiser or event? Enter it below to claim your reward.
            </div>
            <div className="modal-center-body" style={{ padding: "10px 20px 4px" }}>
              <input
                className="inp"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ENTER CODE"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                aria-label="Redemption code"
                style={{ textTransform: "uppercase", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}
              />
              {fail ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)" }}>
                  {FAIL_COPY[fail] || FAIL_COPY.error}
                </div>
              ) : null}
            </div>
          </form>
        )}

        <div className="modal-center-ft" style={{ paddingTop: 8, display: "flex", gap: 10 }}>
          {won ? (
            <>
              {cosmetic && !equipped ? (
                <button
                  type="button"
                  className="btn bo bfull"
                  style={{ flex: 1, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
                  onClick={() => {
                    equipCosmetic(cosmetic);
                    setEquipped(true);
                  }}
                >
                  Equip
                </button>
              ) : null}
              <button
                type="button"
                className="btn bp bfull"
                style={{ flex: 1, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
                onClick={onClose}
              >
                {equipped ? <Check size={14} /> : null}
                {equipped ? "Equipped" : "Done"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn bo bfull"
                style={{ flex: 1, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600 }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bp bfull"
                style={{ flex: 1, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 600, opacity: submitting || !code.trim() ? 0.6 : 1 }}
                disabled={submitting || !code.trim()}
                onClick={handleSubmit}
              >
                {submitting ? <Loader size={14} className="spin" /> : <Gift size={14} />}
                {submitting ? "Checking…" : "Redeem"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
