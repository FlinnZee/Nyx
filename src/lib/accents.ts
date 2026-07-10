import type { AccentName } from "../types";

interface Accent {
  label: string;
  /** primary accent color */
  accent: string;
  /** three aurora stops (cyan-ish, mid, warm) */
  stops: [string, string, string];
}

export const ACCENTS: Record<AccentName, Accent> = {
  aurora: { label: "Aurora", accent: "#8b7bff", stops: ["#3ce7ff", "#8b5cf6", "#ff5fa2"] },
  ember: { label: "Ember", accent: "#ff7a59", stops: ["#ffd166", "#ff7a59", "#ff477e"] },
  mint: { label: "Mint", accent: "#37e6b0", stops: ["#5cf0d6", "#37e6b0", "#3ba9ff"] },
  rose: { label: "Rose", accent: "#ff6f9c", stops: ["#ff9ecb", "#ff6f9c", "#a06bff"] },
  solar: { label: "Solar", accent: "#ffb454", stops: ["#ffe08a", "#ffb454", "#ff6f61"] },
};

export function applyAccent(name: AccentName) {
  const a = ACCENTS[name] ?? ACCENTS.aurora;
  const root = document.documentElement.style;
  root.setProperty("--color-accent", a.accent);
  root.setProperty("--color-cyan", a.stops[0]);
  root.setProperty("--color-violet", a.stops[1]);
  root.setProperty("--color-magenta", a.stops[2]);
}
