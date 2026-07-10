import type { AccentName, ThemeName } from "../types";
import { ACCENTS } from "./accents";

export interface ThemeMeta {
  name: ThemeName;
  label: string;
  tagline: string;
  /** Preview gradient for the settings card. */
  preview: string;
}

export const THEMES: ThemeMeta[] = [
  {
    name: "aurora",
    label: "Midnight Aurora",
    tagline: "The signature Nyx — deep ink & drifting aurora light.",
    preview: "linear-gradient(135deg, #3ce7ff, #8b5cf6 55%, #ff5fa2)",
  },
  {
    name: "vortex",
    label: "Vortex",
    tagline: "Neon-grid cyber energy. Built for the gamers.",
    preview: "linear-gradient(135deg, #00ff9f, #00cfff 55%, #ff2d78)",
  },
  {
    name: "bloom",
    label: "Bloom",
    tagline: "Dreamy pastel glow — soft, warm, and pretty.",
    preview: "linear-gradient(135deg, #ff9ecb, #c9a2ff 55%, #ffc998)",
  },
];

const ACCENT_PROPS = ["--color-accent", "--color-cyan", "--color-violet", "--color-magenta"];

/** Apply the active experience + accent. Non-aurora themes own their palette. */
export function applyTheme(theme: ThemeName, accent: AccentName): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (theme === "aurora") {
    const a = ACCENTS[accent] ?? ACCENTS.aurora;
    root.style.setProperty("--color-accent", a.accent);
    root.style.setProperty("--color-cyan", a.stops[0]);
    root.style.setProperty("--color-violet", a.stops[1]);
    root.style.setProperty("--color-magenta", a.stops[2]);
  } else {
    for (const p of ACCENT_PROPS) root.style.removeProperty(p);
  }
}
