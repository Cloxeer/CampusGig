/** Shimmer placeholder for the stars / rating / review count column on profile header. */
export default function ProfileReviewsBlockSkeleton() {
  return (
    <div style={{ textAlign: "right", width: 72, flexShrink: 0 }}>
      <div className="skel" style={{ width: 65, height: 13, marginBottom: 4, marginLeft: "auto" }} />
      <div className="skel" style={{ width: 30, height: 15, marginBottom: 4, marginLeft: "auto" }} />
      <div className="skel" style={{ width: 58, height: 10, marginBottom: 4, marginLeft: "auto" }} />
      <div className="skel" style={{ width: 52, height: 10, marginLeft: "auto" }} />
    </div>
  );
}
