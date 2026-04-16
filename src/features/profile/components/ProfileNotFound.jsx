import TopBar from "../../../components/TopBar";

/** @param {"self"|"other"} variant */
export default function ProfileNotFound({ variant = "self" }) {
  if (variant === "other") {
    return (
      <div className="page fadein">
        <TopBar title="Profile" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 300 }}>
          <div style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)" }}>User not found</div>
        </div>
      </div>
    );
  }
  return (
    <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 13, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Profile not found</div>
    </div>
  );
}
