import SpotMascot from "../../../components/SpotMascot";
import {
  ALERT_GIG_ACCEPTED_CHAT,
  ALERT_GIG_ACCEPTED_SCRIPT,
  ALERT_SPOT_SIZE,
} from "../../../data/spotGigContactTour";

/** One Spot on the newest "gig accepted" alert. Tapping him does not open the row. */
export default function AlertGigAcceptedSpot({ lookAtRef }) {
  return (
    <SpotMascot
      className="alert-row-spot"
      float={false}
      show
      size={ALERT_SPOT_SIZE}
      mood="excited"
      flip
      lookAtRef={lookAtRef}
      script={ALERT_GIG_ACCEPTED_SCRIPT}
      chatId={ALERT_GIG_ACCEPTED_CHAT}
      autoSpeak
      bubbleSide="top"
      style={{ top: 2, right: 4, zIndex: 4 }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
