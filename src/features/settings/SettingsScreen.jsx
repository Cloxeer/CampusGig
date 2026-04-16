import { useNavigate } from "react-router-dom";
import { useSettingsProfileQueries } from "./hooks/useSettingsProfileQueries";
import { useDeviceNotifyPreferences } from "./hooks/useDeviceNotifyPreferences";
import { useNameEditor } from "./hooks/useNameEditor";
import { useEmailAlertsToggle } from "./hooks/useEmailAlertsToggle";
import { useDeleteAccountModal } from "./hooks/useDeleteAccountModal";
import SettingsScreenHeader from "./sections/SettingsScreenHeader";
import SettingsSignedInEmailCard from "./sections/SettingsSignedInEmailCard";
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
  const nameEditor = useNameEditor(profile);
  const { emailAlerts, handleEmailAlertsChange, emailAlertsSaving } = useEmailAlertsToggle(profile);
  const deleteModal = useDeleteAccountModal();

  return (
    <div className="page fadein">
      <SettingsScreenHeader onBack={() => navigate("/profile")} />

      <div className="scroll scroll--settings-pad scroll--fine-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <SettingsSignedInEmailCard email={email} isPending={isPending} />
        <SettingsNameCard
          firstName={nameEditor.firstName}
          setFirstName={nameEditor.setFirstName}
          lastName={nameEditor.lastName}
          setLastName={nameEditor.setLastName}
          nameError={nameEditor.nameError}
          nameSaving={nameEditor.nameSaving}
          onSaveName={nameEditor.handleSaveName}
          isPending={isPending}
          hasProfile={!!profile}
        />
        <SettingsEditContactsNavRow
          onNavigateEditContacts={() => navigate("/profile/edit", { state: { returnTo: "/settings" } })}
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
