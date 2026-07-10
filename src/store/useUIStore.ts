import { create } from "zustand";
import type { Section } from "../types";

interface UIState {
  section: Section;
  settingsPanel: string;
  selectedContactId: string | null;
  splashDone: boolean;
  toast: string | null;
  /** Mobile stacked navigation: list of chats vs an open chat. */
  mobileView: "list" | "chat";

  setSection: (s: Section) => void;
  setSettingsPanel: (p: string) => void;
  setSelectedContact: (id: string | null) => void;
  setMobileView: (v: "list" | "chat") => void;
  finishSplash: () => void;
  showToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUIStore = create<UIState>((set) => ({
  section: "chats",
  settingsPanel: "appearance",
  selectedContactId: null,
  splashDone: false,
  toast: null,
  mobileView: "list",

  setSection: (section) => set({ section }),
  setMobileView: (mobileView) => set({ mobileView }),
  setSettingsPanel: (settingsPanel) => set({ settingsPanel }),
  setSelectedContact: (selectedContactId) => set({ selectedContactId }),
  finishSplash: () => set({ splashDone: true }),
  showToast: (toast) => {
    set({ toast });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
