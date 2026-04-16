import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, AtSign, Phone, Mail, Star } from "lucide-react";
import FavoriteHintBubble from "./FavoriteHintBubble";
import { formatNanpDisplay, nanpDigitsFromInput } from "../utils/phoneNanp";

const POPULAR = [
  { key: "venmo", label: "Venmo", prefix: "@", placeholder: "yourvenmo" },
  { key: "cashapp", label: "Cash App", prefix: "$", placeholder: "yourcashtag" },
  { key: "paypal", label: "PayPal", icon: "at", placeholder: "email or @handle" },
];

const MORE = [
  { key: "snapchat", label: "Snapchat", prefix: "@", placeholder: "username" },
  { key: "instagram", label: "Instagram", prefix: "@", placeholder: "username" },
  { key: "discord", label: "Discord", prefix: "#", placeholder: "username or user#0000" },
  { key: "zelle", label: "Zelle", prefix: "Z", placeholder: "email or phone for Zelle" },
  { key: "apple_pay", label: "Apple Pay / Apple Cash", prefix: "A", placeholder: "phone or Apple ID email" },
  { key: "google_pay", label: "Google Pay", prefix: "G", placeholder: "email or phone" },
];

const ALL_STAR_FIELDS = [...POPULAR, ...MORE];
const FIELD_BY_KEY = Object.fromEntries(ALL_STAR_FIELDS.map((f) => [f.key, f]));

/** Keys that can be starred and reordered for display to others. */
export const FAVORABLE_CONTACT_KEYS = ALL_STAR_FIELDS.map((f) => f.key);

const validFavoriteKey = new Set(FAVORABLE_CONTACT_KEYS);

export function normalizeContactFavoriteKeys(arr) {
  const seen = new Set();
  const out = [];
  for (const k of arr || []) {
    if (!validFavoriteKey.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function FieldRow({ children, label, optional }) {
  return (
    <div className="field">
      <label className="lbl">
        {label}{" "}
        {optional && (
          <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>optional</span>
        )}
      </label>
      {children}
    </div>
  );
}

function StarToggle({ active, onClick, ariaLabel }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      className="ig-star"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      <Star size={18} strokeWidth={active ? 0 : 2} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

function PopularFieldRow({ f, profile, set, favoriteKeys, requestFavoriteToggle }) {
  const isFav = favoriteKeys.includes(f.key);
  return (
    <FieldRow key={f.key} label={f.label} optional>
      <div className="ig">
        {f.prefix && f.icon !== "at" ? (
          <div className="iad" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500 }}>
            {f.prefix}
          </div>
        ) : (
          <div className="iad">
            <AtSign size={13} />
          </div>
        )}
        <input
          className="ii"
          placeholder={f.placeholder}
          value={profile[f.key] || ""}
          onChange={(e) => set(f.key, e.target.value)}
          autoComplete="off"
        />
        <StarToggle
          active={isFav}
          onClick={requestFavoriteToggle ? (e) => requestFavoriteToggle(f.key, e) : undefined}
          ariaLabel={isFav ? `Remove ${f.label} from favorites` : `Favorite ${f.label} — show first to others`}
        />
      </div>
    </FieldRow>
  );
}

function MoreFieldRow({ f, profile, set, favoriteKeys, requestFavoriteToggle }) {
  const isFav = favoriteKeys.includes(f.key);
  return (
    <FieldRow key={f.key} label={f.label} optional>
      <div className="ig">
        <div
          className="iad"
          style={{
            fontFamily: "var(--mono)",
            fontSize: f.prefix.length > 1 ? 11 : 14,
            fontWeight: 600,
            minWidth: f.prefix.length > 1 ? 36 : undefined,
          }}
        >
          {f.prefix}
        </div>
        <input
          className="ii"
          placeholder={f.placeholder}
          value={profile[f.key] || ""}
          onChange={(e) => set(f.key, e.target.value)}
          autoComplete="off"
        />
        <StarToggle
          active={isFav}
          onClick={requestFavoriteToggle ? (e) => requestFavoriteToggle(f.key, e) : undefined}
          ariaLabel={isFav ? `Remove ${f.label} from favorites` : `Favorite ${f.label} — show first to others`}
        />
      </div>
    </FieldRow>
  );
}

function sectionHeaderStyle() {
  return {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--fg3)",
    fontFamily: "var(--mono)",
    marginBottom: 10,
  };
}

function sectionSubtitleStyle() {
  return { fontSize: 12, color: "var(--fg3)", marginBottom: 12, lineHeight: 1.45 };
}

const FAVORITE_EMPTY_HINT = "You can only favorite this if the field is filled out.";

export default function ContactFields({
  profile,
  onFieldChange,
  emailDisplay,
  phoneMode = "formatted",
  phoneRequired = true,
  favoriteKeys = [],
  onFavoriteToggle,
}) {
  const set = (key, val) => onFieldChange(key, val);

  const [favoriteHint, setFavoriteHint] = useState(null);
  const hintTimerRef = useRef(null);

  const dismissFavoriteHint = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setFavoriteHint(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const flashFavoriteHint = useCallback(
    (anchorRect) => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setFavoriteHint({ anchorRect, message: FAVORITE_EMPTY_HINT });
      hintTimerRef.current = setTimeout(() => {
        dismissFavoriteHint();
      }, 3400);
    },
    [dismissFavoriteHint]
  );

  const requestFavoriteToggle = useCallback(
    (key, event) => {
      if (!onFavoriteToggle) return;
      const isFav = favoriteKeys.includes(key);
      const raw = profile[key];
      const filled = raw != null && String(raw).trim() !== "";
      if (!isFav && !filled) {
        const rect = event?.currentTarget?.getBoundingClientRect?.();
        if (rect) flashFavoriteHint(rect);
        return;
      }
      onFavoriteToggle(key);
    },
    [onFavoriteToggle, favoriteKeys, profile, flashFavoriteHint]
  );

  const favSet = new Set(favoriteKeys);
  const favoriteBlock = favoriteKeys.map((k) => FIELD_BY_KEY[k]).filter(Boolean);

  const restPopular = POPULAR.filter((f) => !favSet.has(f.key));
  const restMore = MORE.filter((f) => !favSet.has(f.key));

  const showFavoritesBlock = favoriteBlock.length > 0 && onFavoriteToggle;

  return (
    <>
      <FavoriteHintBubble
        open={Boolean(favoriteHint)}
        message={favoriteHint?.message ?? ""}
        anchorRect={favoriteHint?.anchorRect ?? null}
        onDismiss={dismissFavoriteHint}
      />

      {showFavoritesBlock && (
        <>
          <div
            style={{
              ...sectionHeaderStyle(),
              marginTop: 4,
            }}
          >
            Favorites
          </div>
          <div style={sectionSubtitleStyle()}>
            These show up first when someone can reach you.
          </div>
          {favoriteBlock.map((f) =>
            POPULAR.some((p) => p.key === f.key) ? (
              <PopularFieldRow
                key={f.key}
                f={f}
                profile={profile}
                set={set}
                favoriteKeys={favoriteKeys}
                requestFavoriteToggle={requestFavoriteToggle}
              />
            ) : (
              <MoreFieldRow
                key={f.key}
                f={f}
                profile={profile}
                set={set}
                favoriteKeys={favoriteKeys}
                requestFavoriteToggle={requestFavoriteToggle}
              />
            )
          )}
        </>
      )}

      <div
        style={{
          ...sectionHeaderStyle(),
          marginTop: showFavoritesBlock ? 18 : 4,
          paddingTop: showFavoritesBlock ? 16 : 0,
          borderTop: showFavoritesBlock ? "1px solid var(--bd)" : "none",
        }}
      >
        Popular
      </div>
      <div style={sectionSubtitleStyle()}>
        Email, phone, and the payment apps most students use first.
      </div>

      {emailDisplay != null && emailDisplay !== "" && (
        <FieldRow label="School email">
          <div className="ig" style={{ opacity: 0.92 }}>
            <div className="iad">
              <Mail size={13} />
            </div>
            <input className="ii" value={emailDisplay} readOnly disabled style={{ color: "var(--fg2)" }} />
          </div>
        </FieldRow>
      )}

      <FieldRow label={<>Phone {phoneRequired && <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 600 }}>required</span>}</>}>
        <div className="ig">
          <div className="iad">
            <Phone size={13} />
          </div>
          <input
            className="ii"
            placeholder="+1 (000) 000-0000"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={profile.phone}
            onChange={(e) => {
              if (phoneMode === "formatted") {
                set("phone", formatNanpDisplay(nanpDigitsFromInput(e.target.value)));
              } else {
                set("phone", e.target.value);
              }
            }}
          />
        </div>
      </FieldRow>

      {restPopular.map((f) => (
        <PopularFieldRow
          key={f.key}
          f={f}
          profile={profile}
          set={set}
          favoriteKeys={favoriteKeys}
          requestFavoriteToggle={requestFavoriteToggle}
        />
      ))}

      <div
        style={{
          ...sectionHeaderStyle(),
          marginTop: 18,
          paddingTop: 16,
          borderTop: "1px solid var(--bd)",
        }}
      >
        More options
      </div>
      <div style={sectionSubtitleStyle()}>
        Social and other payment methods — add any you use.
      </div>

      {restMore.map((f) => (
        <MoreFieldRow
          key={f.key}
          f={f}
          profile={profile}
          set={set}
          favoriteKeys={favoriteKeys}
          requestFavoriteToggle={requestFavoriteToggle}
        />
      ))}

      <div className="callout" style={{ marginTop: 6 }}>
        <div className="ci">
          <Lock size={13} />
        </div>
        <span className="ct">
          <strong>Your contact info stays private.</strong> Phone, messages, and payment handles are only shared with the
          other person when a gig is active or completed — not on your public profile.
        </span>
      </div>
    </>
  );
}
