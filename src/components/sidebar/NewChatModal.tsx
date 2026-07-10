import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Users } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import Avatar from "../ui/Avatar";
import Modal from "../ui/Modal";
import { cn } from "../../lib/cn";

export default function NewChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const contacts = useChatStore((s) => s.contacts);
  const openWith = useChatStore((s) => s.openWith);
  const startGroup = useChatStore((s) => s.startGroup);
  const live = useChatStore((s) => s.live);

  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const friends = useMemo(
    () =>
      Object.values(contacts)
        .filter((c) => !live || c.isFriend)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [contacts, live],
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const close = () => {
    setPicked([]);
    setName("");
    onClose();
  };

  const go = async () => {
    if (picked.length === 0 || busy) return;
    setBusy(true);
    try {
      if (picked.length === 1 && !name.trim()) {
        openWith(picked[0]);
      } else {
        await startGroup(picked, name.trim() || "New group");
      }
      close();
    } finally {
      setBusy(false);
    }
  };

  const isGroup = picked.length > 1 || name.trim().length > 0;

  return (
    <Modal open={open} onClose={close} title="New chat" width={420}>
      {friends.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No contacts yet — add friends by their handle in People.
        </p>
      ) : (
        <>
          <div className="scroll-slim max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {friends.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                    on ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  <Avatar name={c.name} hue={c.hue} src={c.avatarUrl} size={38} showPresence={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text">{c.name}</div>
                    <div className="truncate text-[12px] text-faint">{c.handle}</div>
                  </div>
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

          {picked.length > 1 && (
            <div className="mt-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                className="nyx-input"
              />
            </div>
          )}

          <motion.button
            type="button"
            onClick={go}
            disabled={picked.length === 0 || busy}
            whileTap={{ scale: 0.97 }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-white disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))",
            }}
          >
            {isGroup && <Users size={16} />}
            {busy ? "Creating…" : isGroup ? `Create group (${picked.length})` : "Start chat"}
          </motion.button>
        </>
      )}
    </Modal>
  );
}
