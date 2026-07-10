import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { tapHaptic } from "../../lib/haptics";

export default function IconButton({
  children,
  onClick,
  title,
  active,
  size = 40,
  variant = "ghost",
}: {
  children: ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
  size?: number;
  variant?: "ghost" | "outline" | "danger";
}) {
  return (
    <motion.button
      type="button"
      title={title}
      aria-label={title}
      onClick={() => {
        tapHaptic();
        onClick?.();
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      style={{ width: size, height: size }}
      className={cn(
        "ring-focus grid shrink-0 place-items-center rounded-xl transition-colors",
        variant === "ghost" && "text-muted hover:bg-white/[0.06] hover:text-text",
        variant === "outline" &&
          "border border-line text-muted hover:border-line-strong hover:text-text",
        variant === "danger" && "text-muted hover:bg-red-500/80 hover:text-white",
        active && "bg-white/[0.08] text-text",
      )}
    >
      {children}
    </motion.button>
  );
}
