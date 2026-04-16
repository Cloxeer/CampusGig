import { useEffect } from "react";
import { markAllNotificationsRead } from "../../lib/profile";
import { patchAllReadInCache, invalidateUnreadCount } from "./alertsMutations";

export function useAlertsMarkAllReadOnMount() {
  useEffect(() => {
    let cancelled = false;
    markAllNotificationsRead().then(() => {
      if (cancelled) return;
      patchAllReadInCache();
      invalidateUnreadCount();
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
