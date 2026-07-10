import { motion } from "motion/react";
import { Pin, BellOff, Users } from "lucide-react";
import type { Contact, Conversation, Message } from "../../types";
import Avatar from "../ui/Avatar";
import { avatarGradient, relativeShort } from "../../lib/format";
import { cn } from "../../lib/cn";
import { ME } from "../../data/mock";

export default function ConversationRow({
  conversation,
  contact,
  last,
  active,
  onSelect,
}: {
  conversation: Conversation;
  contact?: Contact;
  last?: Message;
  active: boolean;
  onSelect: () => void;
}) {
  const isGroup = !!conversation.isGroup;
  const title = isGroup ? (conversation.title ?? "Group") : (contact?.name ?? "Chat");

  const body =
    last &&
    (last.kind === "text"
      ? (last.text ?? "")
      : last.kind === "image"
        ? "📷 Photo"
        : last.kind === "voice"
          ? "🎙️ Voice message"
          : `📎 ${last.attachment?.name ?? "File"}`);
  const preview = last ? (last.authorId === ME ? "You: " : "") + body : "Say hello ✨";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full rounded-2xl px-3 py-2.5 text-left"
    >
      {active && (
        <motion.span
          layoutId="conv-active"
          className="absolute inset-0 rounded-2xl border border-line-strong bg-white/[0.07]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span
        className={cn(
          "absolute inset-0 rounded-2xl bg-white/[0.03] opacity-0 transition-opacity duration-200",
          !active && "group-hover:opacity-100",
        )}
      />

      <div className="relative flex items-center gap-3">
        {isGroup ? (
          <div
            className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full text-white"
            style={{ background: avatarGradient((title.length * 47) % 360) }}
          >
            <Users size={20} />
          </div>
        ) : (
          <Avatar
            name={contact?.name ?? "?"}
            hue={contact?.hue ?? 220}
            presence={contact?.presence}
            src={contact?.avatarUrl}
            size={46}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium text-text">{title}</span>
            {conversation.pinned && <Pin size={12} className="shrink-0 text-faint" />}
            {conversation.muted && <BellOff size={12} className="shrink-0 text-faint" />}
            <span className="ml-auto shrink-0 text-[11px] text-faint">
              {last ? relativeShort(last.ts) : ""}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="truncate text-[13px] text-muted">{preview}</span>
            {conversation.unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="ml-auto grid h-[19px] min-w-[19px] shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-violet), var(--color-magenta))",
                  boxShadow: "0 0 12px -2px var(--color-violet)",
                }}
              >
                {conversation.unread}
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
