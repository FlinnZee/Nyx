import { motion } from "motion/react";
import NyxLogo from "../NyxLogo";

export default function AuthLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="relative grid h-20 w-20 place-items-center">
        {/* Spinning aurora ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, var(--color-cyan), var(--color-violet), var(--color-magenta), transparent)",
            animation: "spin-slow 1.1s linear infinite",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <NyxLogo size={40} />
        </motion.div>
      </div>
      <motion.span
        className="aurora-text font-display text-lg font-semibold tracking-wide"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        Nyx
      </motion.span>
    </div>
  );
}
