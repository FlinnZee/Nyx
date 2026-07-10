import { useSettingsStore } from "../store/useSettingsStore";

/**
 * Haptic feedback for touch devices. Uses the Vibration API (Android webview);
 * a no-op where unsupported. Every pattern respects the user's haptics toggle.
 */
function buzz(pattern: number | number[]) {
  if (!useSettingsStore.getState().prefs.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/** Light tick — taps, toggles, nav. */
export const tapHaptic = () => buzz(8);
/** Medium — message sent, action confirmed. */
export const confirmHaptic = () => buzz(16);
/** Double pulse — message received. */
export const receiveHaptic = () => buzz([12, 60, 12]);
/** Strong — call ringing / important. */
export const alertHaptic = () => buzz([40, 80, 40]);
/** Error/deny. */
export const errorHaptic = () => buzz([60, 40, 60]);
