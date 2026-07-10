import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useSettingsStore } from "../store/useSettingsStore";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let granted = false;

export async function initNotifications(): Promise<void> {
  try {
    if (isTauri) {
      granted = await isPermissionGranted();
      if (!granted) granted = (await requestPermission()) === "granted";
    } else if ("Notification" in window) {
      granted = Notification.permission === "granted"
        ? true
        : (await Notification.requestPermission()) === "granted";
    }
  } catch {
    granted = false;
  }
}

/** System notification for an incoming message (only when app is unfocused). */
export function notifyMessage(title: string, body: string): void {
  if (!useSettingsStore.getState().prefs.notifications) return;
  if (document.hasFocus()) return;
  try {
    if (isTauri && granted) {
      sendNotification({ title, body });
    } else if (granted && "Notification" in window) {
      new Notification(title, { body });
    }
  } catch {
    // Notifications are best-effort.
  }
}
