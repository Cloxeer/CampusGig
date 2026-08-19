import { useRef, useState } from "react";
import { Camera, Loader } from "lucide-react";
import ContactFields from "./ContactFields";
import UserAvatar from "./UserAvatar";
import { validateAvatarFile } from "../utils/profileForm";
import { prepareAvatarImage } from "../utils/prepareAvatarImage";

function FormErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      style={{
        background: "var(--err-bg)",
        border: "1px solid #fecaca",
        borderRadius: "var(--r)",
        padding: "10px 12px",
        fontSize: 13,
        color: "var(--err)",
        lineHeight: 1.5,
      }}
    >
      {error}
    </div>
  );
}

export default function ProfileContactForm({
  profile,
  onFieldChange,
  onFavoriteToggle,
  onAvatarSelect,
  emailDisplay,
  error,
  onError,
  avatarDisplayUrl,
  avatarFallback,
  phoneMode = "formatted",
  phoneRequired = true,
  showFavorites = false,
}) {
  const fileInputRef = useRef(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [hover, setHover] = useState(false);

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = validateAvatarFile(file);
    if (!result.ok) {
      onError?.(result.error);
      return;
    }
    onError?.("");
    setPreparingPhoto(true);
    try {
      const jpeg = await prepareAvatarImage(file);
      onAvatarSelect?.(jpeg);
    } catch (err) {
      onError?.(err.message || "Could not read that photo. Try another one.");
    } finally {
      setPreparingPhoto(false);
    }
  }

  const hasPhoto = Boolean(avatarDisplayUrl);
  const changeLabel = hasPhoto ? "Change photo" : "Add photo";

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          /* `flex` collapses the inline-baseline descender gap the CosmeticRing
             wrapper would otherwise add below itself, so the box is exactly the
             photo and the hover camera centers true (not a few px low). */
          style={{ position: "relative", display: "flex", cursor: preparingPhoto ? "wait" : "pointer" }}
          onClick={() => !preparingPhoto && fileInputRef.current?.click()}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {hasPhoto ? (
            /* Shared avatar so the equipped border/ring shows here too — users
               preview exactly how their photo looks with the cosmetic they have
               on. `photoOverride` pins the candidate URL (local pick or stored)
               and `withCosmetics` reads the live equipped border. */
            <UserAvatar
              user={{
                avatar_color: avatarFallback?.color,
                first_name: avatarFallback?.initials?.[0],
                last_name: avatarFallback?.initials?.[1],
              }}
              size={80}
              withCosmetics
              photoOverride={avatarDisplayUrl}
              style={{ border: "2px solid var(--bd)" }}
            />
          ) : avatarFallback ? (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: avatarFallback.color || "var(--bg3)",
                color: avatarFallback.textColor || "white",
                fontSize: avatarFallback.initials ? 26 : undefined,
                fontWeight: avatarFallback.initials ? 700 : undefined,
                fontFamily: avatarFallback.initials ? "var(--mono)" : undefined,
                border: avatarFallback.initials ? "2px solid var(--bd)" : "2px dashed var(--bd2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatarFallback.initials ?? avatarFallback.placeholder}
            </div>
          ) : null}
          {/* Whole photo is the click target; a translucent-white camera wash
              fades in on hover (and while preparing) so it reads as editable
              without a permanent badge. Sits over the photo only (inset 0 =
              the size footprint), so an equipped border ring stays visible. */}
          {hasPhoto && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,.6))",
                opacity: hover || preparingPhoto ? 1 : 0,
                transition: "opacity .15s ease",
                pointerEvents: "none",
                zIndex: 3,
              }}
            >
              {preparingPhoto ? <Loader size={20} className="spin" /> : <Camera size={22} />}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn bg-btn bsm"
          onClick={() => fileInputRef.current?.click()}
          disabled={preparingPhoto}
        >
          {preparingPhoto ? <Loader size={14} className="spin" /> : changeLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/heic,image/heif,.heic,.heif"
          style={{ display: "none" }}
          onChange={handlePhotoSelect}
        />
      </div>

      <ContactFields
        profile={profile}
        onFieldChange={onFieldChange}
        emailDisplay={emailDisplay}
        phoneMode={phoneMode}
        phoneRequired={phoneRequired}
        favoriteKeys={showFavorites ? profile.contact_favorite_keys || [] : undefined}
        onFavoriteToggle={showFavorites ? onFavoriteToggle : undefined}
      />

      <FormErrorBanner error={error} />
    </>
  );
}

export { FormErrorBanner };
