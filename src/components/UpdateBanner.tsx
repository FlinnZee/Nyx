import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X, Download } from "lucide-react";
import { checkForUpdate } from "../lib/updateCheck";
import { openExternal } from "../lib/openUrl";
import { RELEASES_URL } from "../lib/version";

export default function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForUpdate().then(setVersion);
    const t = setInterval(() => checkForUpdate().then(setVersion), 6 * 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence>
      {version && !dismissed && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="relative z-40 flex items-center gap-3 border-b border-line px-5 py-2 text-[13px]"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--color-cyan) 14%, transparent), color-mix(in srgb, var(--color-magenta) 14%, transparent))",
          }}
        >
          <Sparkles size={15} className="text-accent" />
          <span className="text-text">
            Nyx <b>{version}</b> is available.
          </span>
          <button
            type="button"
            onClick={() => openExternal(RELEASES_URL)}
            className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1 font-medium text-white"
            style={{ background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet))" }}
          >
            <Download size={13} /> Update
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-text"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
