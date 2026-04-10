import { Zap, Lock } from "lucide-react";
import Logo from "../components/Logo";

export default function Splash({ setScreen }) {
  return (
    <div className="splash fadein">
      <div className="splash-body">
        <div className="sgrid" />
        <div className="sfade" />
        <div className="scontent">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 44 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--ink)",
                borderRadius: "var(--r)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <Logo size={17} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div className="sdot" />
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--fg3)" }}>
              student-to-student · .edu verified
            </span>
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-.045em",
              lineHeight: 1.05,
              color: "var(--fg)",
              marginBottom: 14,
            }}
          >
            Small tasks.
            <br />
            Real <span style={{ color: "var(--green)" }}>money.</span>
          </div>

          <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.65, maxWidth: 280 }}>
            Post an errand. Pick one up. Build your campus reputation.
          </p>
        </div>
      </div>

      <div className="sfoot">
        <button
          className="btn bp bfull blg"
          onClick={() => setScreen("auth", "signup")}
        >
          Get started
        </button>
        <button
          className="btn bo bfull blg"
          onClick={() => setScreen("auth", "login")}
        >
          Sign in
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 2 }}>
          <Lock size={11} color="var(--fg4)" />
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--fg4)" }}>
            .edu only · verified students
          </span>
        </div>
      </div>
    </div>
  );
}
