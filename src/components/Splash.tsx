import { useEffect } from "react";
import { motion } from "motion/react";
import NyxLogo from "./NyxLogo";
import { useUIStore } from "../store/useUIStore";

export default function Splash() {
  const finish = useUIStore((s) => s.finishSplash);

  useEffect(() => {
    const t = setTimeout(finish, 2000);
    return () => clearTimeout(t);
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 12 }}
          style={{ filter: "drop-shadow(0 0 30px rgba(139,123,255,0.7))" }}
        >
          <NyxLogo size={84} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="aurora-text mt-5 font-display text-4xl font-bold tracking-tight"
        >
          Nyx
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--color-cyan), var(--color-violet), var(--color-magenta))" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-8 text-[12px] tracking-wide text-faint"
      >
        crafted by <span className="text-muted">TK NiRMAL (dr.v0id)</span>
      </motion.p>
    </motion.div>
  );
}
