/** @param {{ status?: string, grace_ends_at?: string } | null | undefined} request */
export function isPendingDeletion(request) {
  return (
    request?.status === "pending" &&
    !!request?.grace_ends_at &&
    new Date(request.grace_ends_at).getTime() > Date.now()
  );
}

/**
 * @param {string | null | undefined} isoString
 * @returns {string}
 */
export function formatGraceEndsAt(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
