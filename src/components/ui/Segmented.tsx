import { motion } from "motion/react";

export interface SegItem {
  value: string;
  label: string;
}

export default function Segmented({
  items,
  value,
  onChange,
  layoutId = "seg",
}: {
  items: SegItem[];
  value: string;
  onChange: (v: string) => void;
  layoutId?: string;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-line bg-white/[0.03] p-1">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={
              "relative flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors " +
              (active ? "text-text" : "text-faint hover:text-muted")
            }
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg border border-line-strong bg-white/[0.08]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
