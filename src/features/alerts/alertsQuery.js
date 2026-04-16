import {
  getMyNotifications,
  getGigStatusesForNotifications,
  getProfilesByIds,
} from "../../lib/profile";
import { collectUserIds } from "./notificationModel";

export async function fetchAlertsBundle() {
  const { notifications: data } = await getMyNotifications();

  const gigIds = [
    ...new Set(data.filter((n) => n.metadata?.gig_id).map((n) => n.metadata.gig_id)),
  ];
  const userIds = collectUserIds(data);

  const [statusMap, profiles] = await Promise.all([
    gigIds.length > 0 ? getGigStatusesForNotifications(gigIds) : {},
    userIds.length > 0 ? getProfilesByIds(userIds) : {},
  ]);

  return { notifications: data, gigStatusMap: statusMap, profileMap: profiles };
}
