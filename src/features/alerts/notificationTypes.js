import { ACTIVE_REQUEST_ALERT_TYPE } from "../../lib/notificationTypes";

export { ACTIVE_REQUEST_ALERT_TYPE };

export const GIG_NOTIF_TYPES = new Set([
  ACTIVE_REQUEST_ALERT_TYPE,
  "gig_request_sent",
  "gig_accepted",
  "gig_rejected",
  "gig_completed",
]);

export const REVIEW_NOTIF_TYPES = new Set(["review_received"]);
