import { AnimatePresence, motion } from "motion/react";
import { useUIStore } from "../../store/useUIStore";

export default function Toast() {
  const toast = useUIStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="glass-panel fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm text-text shadow-xl"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
