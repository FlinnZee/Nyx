import { motion } from "motion/react";

const GROUPS: { name: string; emojis: string[] }[] = [
  { name: "Smileys", emojis: ["😀", "😄", "😁", "😅", "😂", "🙂", "😉", "😍", "😘", "😎", "🤔", "😴", "😇", "🥳", "😭", "😳"] },
  { name: "Gestures", emojis: ["👍", "👎", "👌", "🙌", "👏", "🙏", "💪", "✌️", "🤝", "👋", "🤙", "🫶"] },
  { name: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💫", "✨", "🔥"] },
  { name: "Objects", emojis: ["🚀", "🎉", "⭐", "🌙", "🌈", "☕", "🎧", "💻", "📎", "📷", "🎙️", "⚡"] },
];

export default function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="glass-panel scroll-slim absolute bottom-full right-0 mb-3 max-h-72 w-72 overflow-y-auto rounded-2xl p-3"
    >
      {GROUPS.map((g) => (
        <div key={g.name} className="mb-2">
          <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wider text-faint">
            {g.name}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {g.emojis.map((e, i) => (
              <button
                key={e + i}
                type="button"
                onClick={() => onPick(e)}
                className="grid h-8 place-items-center rounded-lg text-lg transition-transform hover:scale-125 hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
