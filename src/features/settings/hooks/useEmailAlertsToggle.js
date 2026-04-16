import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateMyProfile } from "../../../lib/profile";
import { queryClient, queryKeys } from "../../../lib/queryClient";

export function useEmailAlertsToggle(profile) {
  const [emailAlerts, setEmailAlerts] = useState(true);

  const emailMutation = useMutation({
    mutationFn: async (email_alerts_enabled) => {
      const { error } = await updateMyProfile({ email_alerts_enabled });
      if (error) {
        throw new Error(error.message || "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });

  useEffect(() => {
    if (profile && profile.email_alerts_enabled !== undefined && profile.email_alerts_enabled !== null) {
      setEmailAlerts(!!profile.email_alerts_enabled);
    }
  }, [profile?.id, profile?.email_alerts_enabled]);

  async function handleEmailAlertsChange(next) {
    const prev = emailAlerts;
    setEmailAlerts(next);
    try {
      await emailMutation.mutateAsync(next);
    } catch {
      setEmailAlerts(prev);
    }
  }

  return {
    emailAlerts,
    handleEmailAlertsChange,
    emailAlertsSaving: emailMutation.isPending,
  };
}
