import { useState, useCallback } from "react";
import {
  requestGig,
  acceptGigRequest,
  rejectGigRequest,
  completeGig,
  deleteMyGig,
} from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";

function invalidateGigCaches(gigId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.gigDetail(gigId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
  queryClient.invalidateQueries({ queryKey: queryKeys.hasActiveGig });
}

export function useGigDetailActions({ gigId, onStatusChange, onGigDeleted, onClose }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async (action, fn) => {
      if (!gigId) return { ok: false };
      setLoading(action);
      setError(null);
      const result = await fn();
      setLoading(null);
      if (result.error) {
        setError(result.error.message || "Something went wrong.");
        return { ok: false, error: result.error };
      }
      invalidateGigCaches(gigId);
      onStatusChange?.();
      return { ok: true, ...result };
    },
    [gigId, onStatusChange]
  );

  const request = useCallback(
    () => run("request", () => requestGig(gigId).then((r) => ({ error: r.error }))),
    [gigId, run]
  );

  const accept = useCallback(
    (requestId) =>
      run("accept", () => acceptGigRequest(requestId).then((r) => ({ error: r.error }))),
    [run]
  );

  const reject = useCallback(
    async (requestId) => {
      const result = await run("reject", () =>
        rejectGigRequest(requestId).then((r) => ({ error: r.error }))
      );
      if (result.ok) onClose?.();
      return result;
    },
    [run, onClose]
  );

  const complete = useCallback(
    (id) => run("complete", () => completeGig(id).then((r) => ({ error: r.error }))),
    [run]
  );

  const deleteGig = useCallback(
    async (id) => {
      if (!window.confirm("Delete this gig? This can't be undone.")) return { ok: false };
      const result = await run("delete", () => deleteMyGig(id).then((r) => ({ error: r.error })));
      if (result.ok) {
        onGigDeleted?.();
        onClose?.();
      }
      return result;
    },
    [run, onGigDeleted, onClose]
  );

  return {
    loading,
    error,
    clearError,
    request,
    accept,
    reject,
    complete,
    deleteGig,
    isLoading: (action) => loading === action,
  };
}
