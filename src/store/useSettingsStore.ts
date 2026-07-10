import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Preferences, Profile } from "../types";
import { myProfile } from "../data/mock";

const defaultPrefs: Preferences = {
  accent: "aurora",
  theme: "aurora",
  reduceMotion: false,
  compact: false,
  sendOnEnter: true,
  notifications: true,
  sounds: true,
  haptics: true,
  readReceipts: true,
  showPresence: true,
  enterToSend: true,
};

interface SettingsState {
  profile: Profile;
  prefs: Preferences;
  updateProfile: (patch: Partial<Profile>) => void;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      profile: myProfile,
      prefs: defaultPrefs,
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      setPref: (key, value) =>
        set((s) => ({ prefs: { ...s.prefs, [key]: value } })),
      reset: () => set({ profile: myProfile, prefs: defaultPrefs }),
    }),
    {
      name: "nyx.settings",
      // Deep-merge so newly added preferences get their defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          profile: { ...current.profile, ...(p.profile ?? {}) },
          prefs: { ...current.prefs, ...(p.prefs ?? {}) },
        };
      },
    },
  ),
);
