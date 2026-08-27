import { useEffect } from "react";
import { markAllNotificationsRead } from "../../../lib/profile";
import { patchDismissableReadInCache, invalidateUnreadCount } from "../alertsMutations";

export function useAlertsMarkAllReadOnMount() {
  useEffect(() => {
    let cancelled = false;
    markAllNotificationsRead().then(() => {
      if (cancelled) return;
      patchDismissableReadInCache();
      invalidateUnreadCount();
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
