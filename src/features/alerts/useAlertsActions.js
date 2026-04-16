import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  acceptGigRequest,
} from "../../lib/profile";
import { GIG_NOTIF_TYPES, REVIEW_NOTIF_TYPES } from "./notificationTypes";
import {
  patchAllReadInCache,
  invalidateUnreadCount,
  removeNotifFromCache,
  removeNotifsFromCache,
  markIdsReadInCache,
  markSingleReadInCache,
  invalidateNotificationsQuery,
  invalidateOpenGigsQuery,
} from "./alertsMutations";

export function useAlertsActions() {
  const navigate = useNavigate();
  const [acceptingId, setAcceptingId] = useState(null);

  const handleMarkRead = useCallback(async () => {
    await markAllNotificationsRead();
    patchAllReadInCache();
    invalidateUnreadCount();
  }, []);

  const handleDelete = useCallback(async (notifId) => {
    await deleteNotification(notifId);
    removeNotifFromCache(notifId);
    invalidateUnreadCount();
  }, []);

  const handleDeleteGroup = useCallback(async (items) => {
    await Promise.all(items.map((n) => deleteNotification(n.id)));
    const ids = new Set(items.map((n) => n.id));
    removeNotifsFromCache(ids);
    invalidateUnreadCount();
  }, []);

  const handleNotifClick = useCallback(
    async (n) => {
      if (!n.read) {
        markNotificationRead(n.id);
        markSingleReadInCache(n.id);
        invalidateUnreadCount();
      }
      if (GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id) {
        navigate(`/gigdetails/${n.metadata.gig_id}`, {
          state: { source: "alerts", notification: n, returnTo: "/alerts" },
        });
        return;
      }
      if (REVIEW_NOTIF_TYPES.has(n.type) && n.metadata?.reviewer_id) {
        navigate(`/profile?reviews=1&reviewer=${encodeURIComponent(n.metadata.reviewer_id)}`, {
          state: { returnTo: "/alerts" },
        });
      }
    },
    [navigate]
  );

  const handleGroupClick = useCallback(
    async (items) => {
      const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
        markIdsReadInCache(unreadIds);
        invalidateUnreadCount();
      }
      const latest = items[0];
      if (latest.metadata?.gig_id) {
        navigate(`/gigdetails/${latest.metadata.gig_id}`, {
          state: { source: "alerts", notification: latest, returnTo: "/alerts" },
        });
      }
    },
    [navigate]
  );

  const handleInlineAccept = useCallback(async (e, n) => {
    e.stopPropagation();
    const meta = n.metadata || {};
    if (!meta.request_id || !meta.gig_id || !meta.requester_id) return;

    setAcceptingId(n.id);
    const { error } = await acceptGigRequest(meta.request_id);
    if (!error) {
      invalidateNotificationsQuery();
      invalidateUnreadCount();
      invalidateOpenGigsQuery();
    }
    setAcceptingId(null);
  }, []);

  return {
    acceptingId,
    handleMarkRead,
    handleDelete,
    handleDeleteGroup,
    handleNotifClick,
    handleGroupClick,
    handleInlineAccept,
  };
}
