import { useEffect, useState } from "react";
import { DEVICE_STORAGE_KEYS } from "../settingsConstants";
import { readBool, writeBool } from "../settingsDeviceStorage";

export function useDeviceNotifyPreferences() {
  const [notifyGigUpdates, setNotifyGigUpdates] = useState(() =>
    readBool(DEVICE_STORAGE_KEYS.notifyGigUpdates, true)
  );
  const [notifyAlerts, setNotifyAlerts] = useState(() =>
    readBool(DEVICE_STORAGE_KEYS.notifyAlerts, true)
  );

  useEffect(() => {
    writeBool(DEVICE_STORAGE_KEYS.notifyGigUpdates, notifyGigUpdates);
  }, [notifyGigUpdates]);

  useEffect(() => {
    writeBool(DEVICE_STORAGE_KEYS.notifyAlerts, notifyAlerts);
  }, [notifyAlerts]);

  return { notifyGigUpdates, setNotifyGigUpdates, notifyAlerts, setNotifyAlerts };
}
