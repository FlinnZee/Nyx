import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Forward, Users } from "lucide-react";
import type { Message } from "../../types";
import { useChatStore } from "../../store/useChatStore";
import Avatar from "../ui/Avatar";
import Modal from "../ui/Modal";
import { avatarGradient } from "../../lib/format";
import { cn } from "../../lib/cn";

export default function ForwardModal({
  message,
  onClose,
}: {
  message: Message | null;
  onClose: () => void;
}) {
  const conversations = useChatStore((s) => s.conversations);
  const contacts = useChatStore((s) => s.contacts);
  const forward = useChatStore((s) => s.forwardMessage);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () =>
      conversations.map((c) => ({
        id: c.id,
        title: c.isGroup ? c.title ?? "Group" : contacts[c.contactId]?.name ?? "Chat",
        contact: c.isGroup ? undefined : contacts[c.contactId],
        group: !!c.isGroup,
      })),
    [conversations, contacts],
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const go = async () => {
    if (!message || picked.length === 0 || busy) return;
    setBusy(true);
    try {
      await forward(message, picked);
      setPicked([]);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!message} onClose={onClose} title="Forward to" width={420}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No chats to forward to yet.</p>
      ) : (
        <>
          <div className="scroll-slim max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {rows.map((r) => {
              const on = picked.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                    on ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  {r.group ? (
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
                      style={{ background: avatarGradient((r.title.length * 47) % 360) }}
                    >
                      <Users size={16} />
                    </div>
                  ) : (
                    <Avatar name={r.contact?.name ?? "?"} hue={r.contact?.hue ?? 220} src={r.contact?.avatarUrl} size={36} showPresence={false} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{r.title}</span>
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border transition-colors",
                      on ? "border-transparent text-white" : "border-line-strong text-transparent",
                    )}
                    style={on ? { background: "var(--color-accent)" } : undefined}
                  >
                    <Check size={12} />
                  </span>
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            onClick={go}
            disabled={picked.length === 0 || busy}
            whileTap={{ scale: 0.97 }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))" }}
          >
            <Forward size={16} />
            {busy ? "Forwarding…" : `Forward${picked.length ? ` (${picked.length})` : ""}`}
          </motion.button>
        </>
      )}
    </Modal>
  );
}
