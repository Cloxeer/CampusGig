import { queryClient, queryKeys } from "../../lib/queryClient";
import { ACTIVE_REQUEST_ALERT_TYPE } from "../../lib/notificationTypes";
import { updateNotificationsCache } from "./notificationsCache";

export function patchDismissableReadInCache() {
  updateNotificationsCache((items) =>
    items.map((n) => (n.type === ACTIVE_REQUEST_ALERT_TYPE ? n : { ...n, read: true }))
  );
}

export function invalidateUnreadCount() {
  queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
}

export function invalidateNotificationsQuery() {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
}

export function invalidateOpenGigsQuery() {
  queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
}

export function invalidateHasActiveGigQuery() {
  queryClient.invalidateQueries({ queryKey: queryKeys.hasActiveGig });
}

export function removeNotifFromCache(notifId) {
  updateNotificationsCache((items) => items.filter((n) => n.id !== notifId));
}

export function removeNotifsFromCache(ids) {
  const idSet = ids instanceof Set ? ids : new Set(ids);
  updateNotificationsCache((all) => all.filter((n) => !idSet.has(n.id)));
}

export function markIdsReadInCache(ids) {
  const idSet = new Set(ids);
  updateNotificationsCache((all) =>
    all.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n))
  );
}

export function markSingleReadInCache(notifId) {
  updateNotificationsCache((items) =>
    items.map((notif) => (notif.id === notifId ? { ...notif, read: true } : notif))
  );
}
