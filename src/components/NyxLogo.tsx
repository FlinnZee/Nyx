import { motion } from "motion/react";

/**
 * The Nyx mark: an aurora crescent with an orbiting star.
 * Built as a CSS-gradient fill clipped by an SVG mask — no SVG paint-server
 * references, which some webviews refuse to resolve. The crescent path is a
 * true lune: outer circle c(24,24) r20, bitten by c(34,18) r18, arcs meeting
 * at the computed cusps.
 */
const CRESCENT = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#fff" d="M22.63 4.04A20 20 0 1 0 40.97 34.6A18 18 0 0 1 22.63 4.04Z"/></svg>`,
);
const MASK = `url("data:image/svg+xml,${CRESCENT}")`;

export default function NyxLogo({ size = 28 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 14 }}
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        filter:
          "drop-shadow(0 0 " +
          Math.max(3, size * 0.18) +
          "px color-mix(in srgb, var(--color-violet) 65%, transparent))",
      }}
    >
      {/* Gradient crescent */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 50%, var(--color-magenta))",
          WebkitMaskImage: MASK,
          maskImage: MASK,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      />
      {/* Orbiting star */}
      <motion.span
        className="absolute rounded-full"
        style={{
          left: "72%",
          top: "13%",
          width: Math.max(2.5, size * 0.11),
          height: Math.max(2.5, size * 0.11),
          background: "#eafcff",
          boxShadow: "0 0 " + Math.max(2, size * 0.12) + "px rgba(234,252,255,0.9)",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
