import ContactFields from "./ContactFields";
import ProfilePhotoField from "./ProfilePhotoField";

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
  showAvatar = true,
  showEmail = true,
}) {
  return (
    <>
      {showAvatar ? (
        <ProfilePhotoField
          onAvatarSelect={onAvatarSelect}
          onError={onError}
          avatarDisplayUrl={avatarDisplayUrl}
          avatarFallback={avatarFallback}
        />
      ) : null}

      <ContactFields
        profile={profile}
        onFieldChange={onFieldChange}
        emailDisplay={emailDisplay}
        phoneMode={phoneMode}
        phoneRequired={phoneRequired}
        showEmail={showEmail}
        favoriteKeys={showFavorites ? profile.contact_favorite_keys || [] : undefined}
        onFavoriteToggle={showFavorites ? onFavoriteToggle : undefined}
      />

      <FormErrorBanner error={error} />
    </>
  );
}

export { FormErrorBanner };
