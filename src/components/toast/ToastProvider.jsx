import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CampusToast from "./CampusToast";
import { readToastCorner } from "../../features/settings/toastCornerStorage";
import { DEVICE_STORAGE_KEYS } from "../../features/settings/settingsConstants";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((opts) => {
    const {
      title,
      body = "",
      corner = readToastCorner(DEVICE_STORAGE_KEYS.toastCorner),
      durationMs = 4000,
      showIcon = true,
    } = opts;
    setToast({
      id: Date.now(),
      title,
      body,
      corner,
      durationMs,
      showIcon,
    });
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && toast
        ? createPortal(
            <CampusToast
              key={toast.id}
              title={toast.title}
              body={toast.body}
              corner={toast.corner}
              durationMs={toast.durationMs}
              showIcon={toast.showIcon}
              onDismissComplete={() => setToast(null)}
            />,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
