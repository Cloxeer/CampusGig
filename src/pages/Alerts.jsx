import { ALERTS_DATA } from "../data/mockData";
import TopBar from "../components/TopBar";

export default function Alerts({ setScreen }) {
  return (
    <div className="page fadein">
      <TopBar
        title="Alerts"
        onBack={() => setScreen("home")}
        right={<button className="btn bg-btn bsm">Mark read</button>}
      />

      <div className="scroll" style={{ paddingBottom: 80 }}>
        {ALERTS_DATA.map((a) => (
          <div key={a.id} className={`alert-row ${a.unread ? "unread" : ""}`}>
            <div className="aico" style={{ background: a.iconBg, color: a.iconColor }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", lineHeight: 1.4, marginBottom: 2 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>{a.sub}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>{a.time}</span>
              {a.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink)" }} />}
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
