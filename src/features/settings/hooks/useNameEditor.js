import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateMyProfile } from "../../../lib/profile";
import { queryClient, queryKeys } from "../../../lib/queryClient";

export function useNameEditor(profile) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
  }, [profile?.id, profile?.first_name, profile?.last_name]);

  const nameMutation = useMutation({
    mutationFn: async ({ first_name, last_name }) => {
      const { error } = await updateMyProfile({ first_name, last_name });
      if (error) {
        const err = new Error(error.message || "Couldn't save your name.");
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });

  async function handleSaveName() {
    setNameError("");
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setNameError("First and last name are required.");
      return;
    }
    try {
      await nameMutation.mutateAsync({ first_name: fn, last_name: ln });
    } catch (e) {
      setNameError(e?.message || "Couldn't save your name.");
    }
  }

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    nameError,
    nameSaving: nameMutation.isPending,
    handleSaveName,
  };
}
