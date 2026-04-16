import ReportModal from "./ReportModal";

/** Thin wrapper — same as `<ReportModal subjectType="review" />` for legacy imports. */
export default function ReportReviewModal({ reviewId, onClose, onReported }) {
  if (!reviewId) return null;
  return <ReportModal subjectType="review" reviewId={reviewId} onClose={onClose} onReported={onReported} />;
}
