import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useSettingsStore } from "./useSettingsStore";
import type { Presence } from "../types";

export interface Account {
  id: string;
  name: string;
  handle: string | null;
  bio: string;
  status: string;
  hue: number;
  presence: Presence;
  approved: boolean;
  avatar_url?: string | null;
}

interface AuthState {
  ready: boolean;
  session: Session | null;
  account: Account | null;
  demo: boolean;
  busy: boolean;
  error: string | null;
  /** Friendly info message (not an error), e.g. "check your email". */
  notice: string | null;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  redeemInvite: (code: string, name: string, handle: string) => Promise<void>;
  enterDemo: () => void;
}

async function loadAccount(userId: string): Promise<Account | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!data) return null;
  const account = data as Account;
  if (account.approved) {
    useSettingsStore.getState().updateProfile({
      name: account.name,
      handle: account.handle ?? "",
      bio: account.bio ?? "",
      status: account.status ?? "",
      hue: account.hue ?? 264,
      presence: account.presence ?? "online",
      avatarUrl: account.avatar_url ?? undefined,
    });
  }
  return account;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  session: null,
  account: null,
  demo: false,
  busy: false,
  error: null,
  notice: null,

  init: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ ready: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const account = session ? await loadAccount(session.user.id) : null;
    set({ session, account, ready: true });

    supabase.auth.onAuthStateChange(async (_event, s) => {
      const acc = s ? await loadAccount(s.user.id) : null;
      set({ session: s, account: acc });
    });
  },

  signIn: async (email, password) => {
    if (!supabase) return;
    set({ busy: true, error: null, notice: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const friendly = /confirm/i.test(error.message)
        ? "Almost there — open the confirmation email we sent you, then sign in again."
        : error.message;
      set({ error: friendly, busy: false });
    } else {
      set({ busy: false });
    }
  },

  signUp: async (email, password) => {
    if (!supabase) return;
    set({ busy: true, error: null, notice: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message, busy: false });
      return;
    }
    if (!data.session) {
      set({
        notice:
          "Account created! Check your email for the confirmation link, then come back and sign in.",
        busy: false,
      });
      return;
    }
    set({ busy: false });
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ session: null, account: null });
  },

  redeemInvite: async (code, name, handle) => {
    if (!supabase) return;
    set({ busy: true, error: null });
    const { error } = await supabase.rpc("redeem_invite", {
      p_code: code.trim(),
      p_name: name.trim(),
      p_handle: handle.trim().startsWith("@") ? handle.trim() : "@" + handle.trim(),
    });
    if (error) {
      set({ error: error.message, busy: false });
      return;
    }
    const s = get().session;
    const account = s ? await loadAccount(s.user.id) : null;
    set({ account, busy: false });
  },

  enterDemo: () => set({ demo: true }),
}));
