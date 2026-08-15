import { useRef } from "react";
import { Camera } from "lucide-react";
import ContactFields from "./ContactFields";
import { validateAvatarFile } from "../utils/profileForm";

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

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateAvatarFile(file);
    if (!result.ok) {
      onError?.(result.error);
      return;
    }
    onError?.("");
    onAvatarSelect?.(file);
  }

  const hasPhoto = Boolean(avatarDisplayUrl);
  const changeLabel = hasPhoto ? "Change photo" : "Add photo";

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => fileInputRef.current?.click()}
        >
          {hasPhoto ? (
            <img
              src={avatarDisplayUrl}
              alt="Profile"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--bd)",
              }}
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
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg)",
            }}
          >
            <Camera size={13} />
          </div>
        </div>
        <button type="button" className="btn bg-btn bsm" onClick={() => fileInputRef.current?.click()}>
          {changeLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
