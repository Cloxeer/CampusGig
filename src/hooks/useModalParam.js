import { useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export function useModalParam(key) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
    if (pushedRef.current) {
      pushedRef.current = false;
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [navigate, setSearchParams]);

  useEffect(() => {
    if (!value) pushedRef.current = false;
  }, [value]);

  return [value, open, close];
}
