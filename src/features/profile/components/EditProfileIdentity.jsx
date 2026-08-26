import { ChevronRight } from "lucide-react";
import ProfilePhotoField from "../../../components/ProfilePhotoField";
import NameFields from "../../../components/NameFields";
import { ReadOnlyEmailField } from "../../../components/ContactFields";
import { TagBadge, useDisplayTag } from "../../../components/EquippedTagBadge";
import { getLevel } from "../../../utils/helpers";

function CosmeticsInventoryRow({ repScore, onOpenInventory }) {
  const level = getLevel(repScore || 0);
  const displayTag = useDisplayTag(level.label);

  return (
    <button
      type="button"
      className="btn"
      onClick={onOpenInventory}
      style={{
        width: "100%",
        justifyContent: "space-between",
        padding: "12px 14px",
        border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
        background: "var(--bg)",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--fg)",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
          <span style={{ textAlign: "left", minWidth: 0 }}>
            <span style={{ display: "block" }}>Cosmetics</span>
            <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: "var(--fg3)" }}>
              Tags and borders — open inventory
            </span>
          </span>
          <ChevronRight size={18} color="var(--fg4)" style={{ flexShrink: 0 }} />
        </span>
        {displayTag ? <TagBadge cosmetic={displayTag} small /> : null}
      </span>
    </button>
  );
}

export default function EditProfileIdentity({
  onAvatarSelect,
  onError,
  avatarDisplayUrl,
  avatarFallback,
  firstName,
  lastName,
  onFirstName,
  onLastName,
  emailDisplay,
  repScore,
  onOpenInventory,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ProfilePhotoField
        onAvatarSelect={onAvatarSelect}
        onError={onError}
        avatarDisplayUrl={avatarDisplayUrl}
        avatarFallback={avatarFallback}
      />
      <NameFields
        firstName={firstName}
        lastName={lastName}
        onFirstName={onFirstName}
        onLastName={onLastName}
      />
      <CosmeticsInventoryRow repScore={repScore} onOpenInventory={onOpenInventory} />
      <ReadOnlyEmailField emailDisplay={emailDisplay} />
    </div>
  );
}
