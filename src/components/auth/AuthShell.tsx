import type { ReactNode } from "react";
import { motion } from "motion/react";
import NyxLogo from "../NyxLogo";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="glass-panel w-full max-w-sm rounded-3xl p-7"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <NyxLogo size={46} />
          <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
