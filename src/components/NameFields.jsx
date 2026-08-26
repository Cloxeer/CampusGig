export default function NameFields({ firstName, lastName, onFirstName, onLastName, disabled, idPrefix = "edit" }) {
  const firstId = `${idPrefix}-first-name`;
  const lastId = `${idPrefix}-last-name`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="lbl" htmlFor={firstId}>
          First name
        </label>
        <input
          id={firstId}
          className="inp"
          value={firstName}
          onChange={(e) => onFirstName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          disabled={disabled}
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="lbl" htmlFor={lastId}>
          Last name
        </label>
        <input
          id={lastId}
          className="inp"
          value={lastName}
          onChange={(e) => onLastName(e.target.value)}
          placeholder="Last name"
          autoComplete="family-name"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
