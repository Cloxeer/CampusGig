import { useNavigate } from "react-router-dom";
import { navigateBack } from "../../utils/navBack";
import { Smartphone } from "lucide-react";
import { useSettingsProfileQueries } from "./hooks/useSettingsProfileQueries";
import { useDeviceNotifyPreferences } from "./hooks/useDeviceNotifyPreferences";
import { useEmailAlertsToggle } from "./hooks/useEmailAlertsToggle";
import { useDeleteAccountModal } from "./hooks/useDeleteAccountModal";
import SettingsScreenHeader from "./sections/SettingsScreenHeader";
import SettingsSignedInEmailCard from "./sections/SettingsSignedInEmailCard";
import SettingsPasscodeCard from "./sections/SettingsPasscodeCard";
import SettingsNameCard from "./sections/SettingsNameCard";
import SettingsEditContactsNavRow from "./sections/SettingsEditContactsNavRow";
import SettingsAlertsCard from "./sections/SettingsAlertsCard";
import SettingsToastPosition from "./sections/SettingsToastPosition";
import SettingsLegalNavRows from "./sections/SettingsLegalNavRows";
import SettingsDangerZone from "./sections/SettingsDangerZone";
import SettingsVersionFooter from "./sections/SettingsVersionFooter";
import DeleteAccountModal from "./DeleteAccountModal";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { profile, email, isPending, isPendingDeletion, graceEndsLabel } = useSettingsProfileQueries();
  const { notifyGigUpdates, setNotifyGigUpdates, notifyAlerts, setNotifyAlerts } = useDeviceNotifyPreferences();
  const { emailAlerts, handleEmailAlertsChange, emailAlertsSaving } = useEmailAlertsToggle(profile);
  const deleteModal = useDeleteAccountModal();

  return (
    <div className="page fadein">
      <SettingsScreenHeader onBack={() => navigateBack(navigate, "/profile")} />

      <div className="scroll scroll--settings-pad scroll--fine-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <SettingsSignedInEmailCard email={email} isPending={isPending} />
        <SettingsPasscodeCard profile={profile} isPending={isPending} />
        <SettingsNameCard
          onNavigateEditProfile={() =>
            navigate("/profile/edit?tab=profile", { state: { returnTo: "/settings" } })
          }
        />
        <SettingsEditContactsNavRow
          icon={Smartphone}
          label="Edit contacts & payment methods"
          onNavigateEditContacts={() =>
            navigate("/profile/edit?tab=contacts", { state: { returnTo: "/settings" } })
          }
        />
        <SettingsAlertsCard
          notifyGigUpdates={notifyGigUpdates}
          setNotifyGigUpdates={setNotifyGigUpdates}
          notifyAlerts={notifyAlerts}
          setNotifyAlerts={setNotifyAlerts}
          emailAlerts={emailAlerts}
          onEmailAlertsChange={handleEmailAlertsChange}
          emailAlertsSaving={emailAlertsSaving}
        />
        <SettingsToastPosition />
        <SettingsLegalNavRows onTerms={() => navigate("/terms")} onPrivacy={() => navigate("/privacy")} />
        <SettingsDangerZone
          isPendingDeletion={isPendingDeletion}
          graceEndsLabel={graceEndsLabel}
          onOpenDeleteModal={() => deleteModal.setDeleteModalOpen(true)}
        />
        <SettingsVersionFooter />
      </div>

      {deleteModal.deleteModalOpen ? (
        <DeleteAccountModal
          onBackdropClick={deleteModal.closeDeleteModal}
          onClose={deleteModal.closeDeleteModal}
          deleteConfirmInput={deleteModal.deleteConfirmInput}
          onDeleteConfirmInputChange={deleteModal.setDeleteConfirmInput}
          deleteError={deleteModal.deleteError}
          deleteConfirmMatches={deleteModal.deleteConfirmMatches}
          deleteSubmitting={deleteModal.deleteSubmitting}
          onConfirmDelete={deleteModal.handleConfirmDeleteAccount}
        />
      ) : null}
    </div>
  );
}
