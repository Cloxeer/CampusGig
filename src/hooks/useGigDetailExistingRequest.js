import { useState, useEffect } from "react";
import { getMyRequestForGig } from "../lib/profile";

export function useGigDetailExistingRequest(gigId, { enabled = true, refreshKey = 0 } = {}) {
  const [request, setRequest] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!gigId || !enabled) {
        setRequest(null);
        setChecking(false);
        return;
      }
      setChecking(true);
      const { request: r } = await getMyRequestForGig(gigId);
      if (!cancelled) {
        setRequest(r);
        setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [gigId, enabled, refreshKey]);

  return { existingRequest: request, checkingRequest: checking };
}
