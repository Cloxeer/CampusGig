export default function SettingsRowToggle({ icon: Icon, label, hint, checked, onChange, isLast, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: isLast ? "none" : "1px solid var(--bd)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r)",
          background: "var(--bg3)",
          border: "1px solid var(--bd)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg3)",
          flexShrink: 0,
        }}
      >
        <Icon size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{label}</div>
        {hint ? (
          <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 2, lineHeight: 1.35 }}>{hint}</div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: "none",
          background: checked ? "var(--green-d)" : "var(--bd2)",
          position: "relative",
          cursor: disabled ? "default" : "pointer",
          flexShrink: 0,
          transition: "background .15s ease",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 22 : 3,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            transition: "left .15s ease",
          }}
        />
      </button>
    </div>
  );
}
