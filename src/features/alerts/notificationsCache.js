import { queryClient, queryKeys } from "../../lib/queryClient";

export function updateNotificationsCache(updater) {
  queryClient.setQueryData(queryKeys.notifications, (old) => {
    if (!old) return old;
    return { ...old, notifications: updater(old.notifications) };
  });
}
