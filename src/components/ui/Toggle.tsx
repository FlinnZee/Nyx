import { motion } from "motion/react";
import { tapHaptic } from "../../lib/haptics";

export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        tapHaptic();
        onChange(!checked);
      }}
      className="ring-focus relative h-[26px] w-[46px] shrink-0 rounded-full p-[3px] transition-colors duration-300"
      style={{
        background: checked
          ? "linear-gradient(90deg, var(--color-cyan), var(--color-violet))"
          : "rgba(255,255,255,0.10)",
        boxShadow: checked ? "0 0 14px -3px var(--color-violet)" : "none",
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className="block h-5 w-5 rounded-full bg-white shadow"
        style={{ marginLeft: checked ? 20 : 0 }}
      />
    </button>
  );
}
