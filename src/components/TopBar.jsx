import { ArrowLeft } from "lucide-react";

export default function TopBar({ title, onBack, right }) {
  return (
    <div className="topbar">
      <button className="btn bg-btn bico" onClick={onBack}>
        <ArrowLeft size={15} />
      </button>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.02em" }}>
        {title}
      </span>
      {right || <div style={{ width: 34 }} />}
    </div>
  );
}
