import { getOtherUserId } from "./notificationModel";

export function resolveNotifAvatar(notification, profileMap) {
  const meta = notification.metadata || {};
  const otherId = getOtherUserId(meta);
  const liveProfile = otherId ? profileMap[otherId] : null;

  if (liveProfile) return liveProfile;

  if (meta.other_avatar_url) {
    return {
      resolvedAvatarUrl: meta.other_avatar_url,
      avatar_color: meta.other_avatar_color || "#6366f1",
      first_name: "",
      last_name: "",
    };
  }

  return null;
}
