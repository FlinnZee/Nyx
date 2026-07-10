import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Device linking, WhatsApp-style:
 *  - the NEW (logged-out) device mints a short link code, shows it as a QR,
 *    and listens on a private channel;
 *  - an EXISTING (logged-in) device scans the QR (or types the code) and
 *    beams its session across that channel;
 *  - the new device adopts the session and is signed in.
 */

export interface LinkPayload {
  access_token: string;
  refresh_token: string;
}

export function makeLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  for (const b of buf) out += chars[b % chars.length];
  return out;
}

export const linkQrValue = (code: string) => `nyx-link:${code}`;

export function parseLinkQr(text: string): string | null {
  const m = /^nyx-link:([A-Z2-9]{6})$/i.exec(text.trim());
  return m ? m[1].toUpperCase() : null;
}

/** New device: wait for a session to arrive for `code`. Returns unsubscribe. */
export function waitForLink(
  code: string,
  onSession: (p: LinkPayload) => void,
): () => void {
  if (!supabase) return () => {};
  const ch: RealtimeChannel = supabase.channel(`link:${code}`);
  ch.on("broadcast", { event: "session" }, ({ payload }) => {
    const p = payload as LinkPayload;
    if (p?.access_token && p?.refresh_token) onSession(p);
  });
  ch.subscribe();
  return () => {
    supabase?.removeChannel(ch);
  };
}

/** Existing device: beam the current session to the device showing `code`. */
export async function sendSessionTo(code: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return false;
  const ch = supabase.channel(`link:${code}`);
  await new Promise<void>((res) => ch.subscribe((st) => st === "SUBSCRIBED" && res()));
  const ok = await ch.send({
    type: "broadcast",
    event: "session",
    payload: { access_token: s.access_token, refresh_token: s.refresh_token },
  });
  supabase.removeChannel(ch);
  return ok === "ok";
}

/** New device: adopt a received session. */
export async function adoptSession(p: LinkPayload): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.auth.setSession(p);
  return !error;
}
