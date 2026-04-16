import Logo, { LogoMark } from "../../../components/Logo";

export default function ProfileTopBar({ profileBackTarget, navigate }) {
  return (
    <>
      <button
        className="btn bg-btn bico"
        onClick={() =>
          profileBackTarget ? navigate(profileBackTarget, { replace: true }) : navigate("/")
        }
      >
        <span style={{ fontSize: 15 }}>←</span>
      </button>
      <div className="tlogo">
        <LogoMark />
        <Logo />
      </div>
    </>
  );
}
