import { useEffect, useState } from "react";
import { DEVICE_STORAGE_KEYS } from "../settingsConstants";
import { readToastCorner, writeToastCorner } from "../toastCornerStorage";

export function useToastCornerPreference() {
  const [corner, setCorner] = useState(() => readToastCorner(DEVICE_STORAGE_KEYS.toastCorner));

  useEffect(() => {
    writeToastCorner(DEVICE_STORAGE_KEYS.toastCorner, corner);
  }, [corner]);

  return { corner, setCorner };
}
