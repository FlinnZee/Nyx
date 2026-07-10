import { openUrl as tauriOpen } from "@tauri-apps/plugin-opener";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Open a URL in the user's default browser (native), or a new tab in dev. */
export async function openExternal(url: string): Promise<void> {
  try {
    if (isTauri) await tauriOpen(url);
    else window.open(url, "_blank", "noopener");
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
