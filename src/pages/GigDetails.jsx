import { useLocation, useNavigate, useParams } from "react-router-dom";
import AlertDetailModal from "../components/modals/AlertDetailModal";
import { safeAppReturnTo } from "../hooks/useModalParam";

export default function GigDetails({ currentUserId }) {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const notification = location.state?.notification || null;

  function handleClose() {
    const r = safeAppReturnTo(location.state);
    if (r) navigate(r, { replace: true });
    else navigate(-1);
  }

  return (
    <AlertDetailModal
      notification={notification}
      gigId={gigId}
      currentUserId={currentUserId}
      asPage
      onClose={handleClose}
      onStatusChange={() => {}}
    />
  );
}
