import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Lock, HelpCircle } from "lucide-react";
import { COSMETICS, RARITIES, RARITY_ORDER, tierTagForLabel } from "../data/cosmetics";
import { getLevel } from "../utils/helpers";
import { getInventory, equipCosmetic, unequipType, subscribeInventory } from "../lib/cosmeticsInventory";
import { TagBadge } from "../components/EquippedTagBadge";
import UserAvatar from "../components/UserAvatar";
import CosmeticRing from "../components/CosmeticRing";
import { getMyProfile, getAvatarUrl } from "../lib/profile";
import { queryKeys } from "../lib/queryClient";
import { safeAppReturnTo } from "../hooks/useModalParam";
import "./inventory.css";

/**
 * Inventory — Apple-Settings-style picker: live preview on top, then one quiet
 * grouped list per slot (tag / border). Radio selection; rarity shows only in
 * the swatch + a small label. Ownership is server-backed (see cosmeticsInventory).
 */

/** One diameter for the live-preview avatar across every state (matches the
 *  bare-fallback `.invx-preview__avatar` size in inventory.css). */
const PREVIEW_AVATAR = 72;

/** A border shown in the list = a mini avatar: THE SAME CosmeticRing everyone
 *  uses, wrapping a white "hole" where a photo would sit. Identical to the real
 *  avatar, just smaller. */
function BorderSwatch({ cosmetic }) {
  return (
    <CosmeticRing cosmetic={cosmetic} size={26} style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.07)" }}>
      <span className="invx-swatch__hole" />
    </CosmeticRing>
  );
}

/** Small "?" info affordance — hover (desktop) or tap/focus (mobile/keyboard)
 *  reveals a clean popover. Rendered inside the Row button as a non-interactive
 *  <span> (stops click bubbling so it never toggles the row selection). */
function InfoHint({ label, children }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!(e.target instanceof Element) || !e.target.closest(".invx-hint")) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);
  return (
    <span
      className={`invx-hint${open ? " invx-hint--open" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        } else if (e.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <HelpCircle size={14} strokeWidth={2.2} aria-hidden />
      <span className="invx-hint__pop" role="tooltip">
        {children}
      </span>
    </span>
  );
}

function Row({ selected, locked, onSelect, children, sub, swatch, badge, count = 0, name, hint }) {
  return (
    <button
      type="button"
      className={`invx-row${locked ? " invx-row--locked" : ""}`}
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      aria-pressed={locked ? undefined : selected}
      aria-label={locked ? `${name || children} — locked` : undefined}
    >
      {badge ? (
        /* Tag rows show THE real badge (the app-wide TagBadge) — no swatch,
           no repeated name text. */
        <span className="invx-row__badge">{badge}</span>
      ) : (
        <>
          <span className="invx-row__swatch">{swatch}</span>
          <span className="invx-row__name">{children}</span>
          {hint}
        </>
      )}
      <span className="invx-row__meta">
        {count > 1 ? <span className="invx-row__count">×{count}</span> : null}
        {sub ? <span className="invx-row__sub">{sub}</span> : null}
      </span>
      {locked ? (
        <span className="invx-lock" aria-hidden>
          <Lock size={12} strokeWidth={2.4} />
        </span>
      ) : (
        <span className={`invx-check${selected ? " invx-check--on" : ""}`} aria-hidden>
          {selected ? <Check size={12} strokeWidth={3} /> : null}
        </span>
      )}
    </button>
  );
}

/** Full catalog per slot, Crossy Road-style: owned selectable, rest grayed out. */
function SlotSection({ items, ownedIds, counts, equippedId, type }) {
  if (!items.length) return null;
  return (
    <section className="invx-section">
      <div className="invx-list">
        <Row
          selected={!equippedId}
          onSelect={() => unequipType(type)}
          swatch={<span className="invx-swatch invx-swatch--none" aria-hidden />}
          hint={
            <InfoHint label="What does Default mean?">
              “Default” shows the badge for your current rep stage
              {type === "tag" ? " (New, Reliable, Trusted…)" : ""}. Earn and equip your own on the Rep path to replace it.
            </InfoHint>
          }
        >
          Default
        </Row>
        {items.map((c) => {
          const locked = !ownedIds.includes(c.id);
          return (
            <Row
              key={c.id}
              locked={locked}
              selected={equippedId === c.id}
              onSelect={() => equipCosmetic(c)}
              sub={RARITIES[c.rarity].label}
              count={counts?.[c.id] || 0}
              name={c.name}
              badge={c.type === "tag" ? <TagBadge cosmetic={c} /> : undefined}
              swatch={c.type === "border" ? <BorderSwatch cosmetic={c} /> : undefined}
            >
              {c.name}
            </Row>
          );
        })}
      </div>
    </section>
  );
}

export default function Inventory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inv, setInv] = useState(getInventory);
  /** Which slot's catalog is on screen — swapped via the segmented control. */
  const [view, setView] = useState("tag"); // tag | border

  useEffect(() => subscribeInventory(() => setInv(getInventory())), []);

  /* Real profile photo in the preview (guests fall back to the "?" avatar). */
  const { data: profileData } = useQuery({ queryKey: queryKeys.myProfile, queryFn: getMyProfile });
  const profile = profileData?.profile ?? null;
  const previewAvatarUrl = profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null;

  /* Ordered by rarity (common → cosmic). Stable, so each tier tag (which leads
     the catalog) sits at the front of its own rarity group. */
  const byRarity = (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
  const tags = COSMETICS.filter((c) => c.type === "tag").sort(byRarity);
  const borders = COSMETICS.filter((c) => c.type === "border").sort(byRarity);
  const ownedCount = inv.owned.length;

  const equippedTag = tags.find((c) => c.id === inv.equipped.tag) || null;
  const equippedBorder = borders.find((c) => c.id === inv.equipped.border) || null;
  /* Preview shows the same DISPLAY tag every other surface shows: the equipped
     cosmetic, else the current tier tag ("None" falls back to your tier). */
  const displayTag = equippedTag || tierTagForLabel(getLevel(profile?.rep_score || 0).label);

  function goBack() {
    const r = safeAppReturnTo(location.state);
    navigate(r || "/profile");
  }

  return (
    <div className="page fadein">
      <header className="topbar">
        <button type="button" className="btn bg-btn bico" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={15} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>Inventory</div>
        {/* Spacer keeps the title centered now the preview toggle is gone. */}
        <span aria-hidden style={{ width: 34 }} />
      </header>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div className="invx-wrap">
          {/* Live preview — how your equipped set looks. ONE diameter for every
              path (signed-in photo, guest ring, bare fallback) so the hero never
              changes size between states. */}
          <div className="invx-preview">
            {profile ? (
              /* Your actual photo, wearing the equipped ring (same logic as
                 everywhere else — UserAvatar handles the border itself). */
              <UserAvatar
                user={{
                  resolvedAvatarUrl: previewAvatarUrl,
                  avatar_color: profile.avatar_color,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                }}
                size={PREVIEW_AVATAR}
                withCosmetics
              />
            ) : equippedBorder ? (
              /* Guest (no photo): the same CosmeticRing wrapping the "?" chip. */
              <CosmeticRing cosmetic={equippedBorder} size={PREVIEW_AVATAR}>
                <span className="invx-preview__ph">?</span>
              </CosmeticRing>
            ) : (
              <span className="invx-preview__avatar">
                <span className="invx-preview__ph">?</span>
              </span>
            )}
            {displayTag ? (
              /* The EXACT badge used across the app — no bespoke pill. Shows the
                 equipped tag, or your tier tag when "None" is selected. */
              <TagBadge cosmetic={displayTag} />
            ) : (
              <span className="invx-preview__none">No tag equipped</span>
            )}
          </div>

          {ownedCount === 0 ? (
            <button type="button" className="invx-earn" onClick={() => navigate("/profile/rep")}>
              Open chests on the Rep path to start unlocking →
            </button>
          ) : null}

          {/* View swap — the SAME tab bar the profile uses (Activity | Board). */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", marginBottom: 14 }} role="tablist" aria-label="Cosmetic type">
            <button
              type="button"
              role="tab"
              aria-selected={view === "tag"}
              className={`ptab ${view === "tag" ? "on" : ""}`}
              onClick={() => setView("tag")}
            >
              Tags
              <span className="invx-tabcount">
                {tags.filter((c) => inv.owned.includes(c.id)).length}/{tags.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "border"}
              className={`ptab ${view === "border" ? "on" : ""}`}
              onClick={() => setView("border")}
            >
              Borders
              <span className="invx-tabcount">
                {borders.filter((c) => inv.owned.includes(c.id)).length}/{borders.length}
              </span>
            </button>
          </div>

          {view === "tag" ? (
            <SlotSection items={tags} ownedIds={inv.owned} counts={inv.counts} equippedId={inv.equipped.tag} type="tag" />
          ) : (
            <SlotSection items={borders} ownedIds={inv.owned} counts={inv.counts} equippedId={inv.equipped.border} type="border" />
          )}

          <div className="invx-foot">Shown on your profile and wherever your avatar appears.</div>
        </div>
      </div>
    </div>
  );
}
