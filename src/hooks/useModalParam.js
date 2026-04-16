import { useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

/** In-app paths only — avoids open redirects from tampered history state. */
export function safeAppReturnTo(state) {
  const r = state?.returnTo;
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : null;
}

export function useModalParam(key) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const value = searchParams.get(key);
  const pushedRef = useRef(false);

  const open = useCallback(
    (val = "1") => {
      pushedRef.current = true;
      setSearchParams({ [key]: val });
    },
    [key, setSearchParams]
  );

  const close = useCallback(() => {
    const returnTo = safeAppReturnTo(location.state);
    if (pushedRef.current) {
      pushedRef.current = false;
      navigate(-1);
    } else if (returnTo) {
      navigate(returnTo, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [navigate, setSearchParams, location.state]);

  useEffect(() => {
    if (!value) pushedRef.current = false;
  }, [value]);

  return [value, open, close];
}
