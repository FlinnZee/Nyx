import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Reply, Forward, Copy, Trash2, type LucideIcon } from "lucide-react";
import type { Message } from "../../types";
import { useChatStore } from "../../store/useChatStore";
import { useUIStore } from "../../store/useUIStore";
import { tapHaptic } from "../../lib/haptics";
import { ME } from "../../data/mock";

const QUICK = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

/**
 * Touch action sheet: long-press a message and everything you can do to it
 * slides up from the bottom — reactions, reply, forward, copy, delete.
 */
export default function MessageActionSheet({
  message,
  onClose,
  onForward,
}: {
  message: Message | null;
  onClose: () => void;
  onForward: (m: Message) => void;
}) {
  const react = useChatStore((s) => s.react);
  const setReply = useChatStore((s) => s.setReply);
  const deleteForEveryone = useChatStore((s) => s.deleteForEveryone);
  const hideForMe = useChatStore((s) => s.hideForMe);
  const showToast = useUIStore((s) => s.showToast);

  const act = (fn: () => void) => {
    tapHaptic();
    fn();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed inset-0 z-[75] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="glass-panel relative z-10 rounded-t-3xl px-4 pt-3"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            {/* Quick reactions */}
            {!message.deleted && (
              <div className="mb-2 flex justify-between px-2">
                {QUICK.map((e) => (
                  <motion.button
                    key={e}
                    type="button"
                    whileTap={{ scale: 1.4 }}
                    onClick={() => act(() => react(message.conversationId, message.id, e))}
                    className="grid h-11 w-11 place-items-center rounded-full text-2xl"
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="space-y-0.5 border-t border-line pt-2">
              {!message.deleted && (
                <>
                  <SheetRow icon={Reply} label="Reply" onClick={() => act(() => setReply(message.conversationId, message))} />
                  <SheetRow icon={Forward} label="Forward" onClick={() => act(() => onForward(message))} />
                  {message.kind === "text" && (
                    <SheetRow
                      icon={Copy}
                      label="Copy"
                      onClick={() =>
                        act(() => {
                          navigator.clipboard?.writeText(message.text ?? "");
                          showToast("Copied");
                        })
                      }
                    />
                  )}
                </>
              )}
              <SheetRow icon={Trash2} label="Delete for me" onClick={() => act(() => hideForMe(message.conversationId, message.id))} />
              {message.authorId === ME && !message.deleted && (
                <SheetRow
                  danger
                  icon={Trash2}
                  label="Delete for everyone"
                  onClick={() => act(() => deleteForEveryone(message.conversationId, message.id))}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SheetRow({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] transition-colors active:bg-white/[0.08] " +
        (danger ? "text-red-400" : "text-text")
      }
    >
      <Icon size={19} className={danger ? "" : "text-muted"} />
      {label}
    </button>
  );
}
