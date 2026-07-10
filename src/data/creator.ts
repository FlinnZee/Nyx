export type LinkKind = "github" | "x" | "instagram" | "mail" | "globe";

export interface CreatorLink {
  kind: LinkKind;
  label: string;
  /** Full URL (or mailto:) — leave blank to hide this link. */
  value: string;
}

/**
 * Edit this file to make the About page yours.
 * Drop a square portrait at `public/creator.jpg` to show your photo.
 */
export const creator = {
  name: "TK NiRMAL",
  alias: "dr.v0id",
  role: "Creator · Designer · Developer",
  tagline: "I craft futuristic, human-made software — designed and built end to end.",
  location: "",
  /**
   * Served from the public/ folder. With more than one, the About page
   * rotates to the next photo on every visit.
   */
  photos: ["/creator-1.jpg", "/creator-2.jpg"],
  /** Fallback avatar hue if no photo is present. */
  hue: 264,
  links: [
    { kind: "github", label: "GitHub", value: "" },
    { kind: "x", label: "X", value: "" },
    { kind: "instagram", label: "Instagram", value: "" },
    { kind: "mail", label: "Email", value: "" },
    { kind: "globe", label: "Website", value: "" },
  ] as CreatorLink[],
};
