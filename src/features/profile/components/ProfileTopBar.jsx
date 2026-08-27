import { BrandLockup } from "../../../components/Logo";
import { navigateBack } from "../../../utils/navBack";

export default function ProfileTopBar({ profileBackTarget, navigate }) {
  return (
    <>
      <button
        className="btn bg-btn bico"
        onClick={() => navigateBack(navigate, profileBackTarget || "/")}
      >
        <span style={{ fontSize: 15 }}>←</span>
      </button>
      <BrandLockup />
    </>
  );
}
