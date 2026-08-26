import { User } from "lucide-react";
import SettingsEditContactsNavRow from "./SettingsEditContactsNavRow";

/** Name is edited on Edit profile — this row is the single door from Settings. */
export default function SettingsNameCard({ onNavigateEditProfile }) {
  return (
    <SettingsEditContactsNavRow
      icon={User}
      label="Edit profile"
      onNavigateEditContacts={onNavigateEditProfile}
    />
  );
}
