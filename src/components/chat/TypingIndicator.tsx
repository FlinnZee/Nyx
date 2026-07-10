import { motion } from "motion/react";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.9 }}
      className="flex justify-start"
    >
      <div className="glass flex items-center gap-1.5 rounded-[18px] rounded-bl-md px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-muted"
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.16,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
