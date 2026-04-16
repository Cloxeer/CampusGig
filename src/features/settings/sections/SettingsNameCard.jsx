import { Loader } from "lucide-react";

export default function SettingsNameCard({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  nameError,
  nameSaving,
  onSaveName,
  isPending,
  hasProfile,
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
        padding: "14px 14px",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 10 }}>Your name</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="lbl">First name</label>
          <input
            className="inp"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            autoComplete="given-name"
            disabled={isPending || !hasProfile}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="lbl">Last name</label>
          <input
            className="inp"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            autoComplete="family-name"
            disabled={isPending || !hasProfile}
          />
        </div>
      </div>
      {nameError ? (
        <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", marginTop: 10 }}>{nameError}</div>
      ) : null}
      <button
        type="button"
        className="btn bp bfull"
        style={{ marginTop: 12, opacity: nameSaving ? 0.75 : 1 }}
        onClick={onSaveName}
        disabled={nameSaving || isPending || !hasProfile}
      >
        {nameSaving ? <Loader size={16} className="spin" /> : "Save name"}
      </button>
    </div>
  );
}
