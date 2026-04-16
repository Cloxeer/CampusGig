import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestAccountDeletion } from "../../../lib/profile";
import { queryClient, queryKeys } from "../../../lib/queryClient";
import { DELETE_CONFIRM_PHRASE, SETTINGS_SUPPORT_EMAIL } from "../settingsConstants";

export function useDeleteAccountModal() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteConfirmInput("");
    setDeleteError("");
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await requestAccountDeletion();
      if (error) {
        throw new Error(
          error.message || `Couldn't schedule deletion. Try again or email ${SETTINGS_SUPPORT_EMAIL}.`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountDeletion });
    },
  });

  function deleteConfirmMatches() {
    return deleteConfirmInput.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
  }

  async function handleConfirmDeleteAccount() {
    if (!deleteConfirmMatches()) return;
    setDeleteError("");
    try {
      await deleteMutation.mutateAsync();
      closeDeleteModal();
    } catch (e) {
      setDeleteError(
        e?.message || `Couldn't schedule deletion. Try again or email ${SETTINGS_SUPPORT_EMAIL}.`
      );
    }
  }

  return {
    deleteModalOpen,
    setDeleteModalOpen,
    deleteConfirmInput,
    setDeleteConfirmInput,
    deleteError,
    closeDeleteModal,
    deleteConfirmMatches,
    handleConfirmDeleteAccount,
    deleteSubmitting: deleteMutation.isPending,
  };
}
