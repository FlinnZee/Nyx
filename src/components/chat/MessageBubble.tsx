import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  ImageOff,
  Ban,
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Trash2,
  SmilePlus,
} from "lucide-react";
import type { Contact, Message } from "../../types";
import { clock, fileSize } from "../../lib/format";
import { cn } from "../../lib/cn";
import { useChatStore } from "../../store/useChatStore";
import { useUIStore } from "../../store/useUIStore";
import { ME } from "../../data/mock";
import { useCachedMedia } from "../../hooks/useCachedMedia";
import VoiceMessage from "./VoiceMessage";
import Modal from "../ui/Modal";

const QUICK = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

function snippet(m: Message): string {
  if (m.deleted) return "Deleted message";
  if (m.kind === "text") return m.text ?? "";
  if (m.kind === "image") return "📷 Photo";
  if (m.kind === "voice") return "🎙️ Voice message";
  if (m.kind === "file") return `📎 ${m.attachment?.name ?? "File"}`;
  return "Message";
}

export default function MessageBubble({
  message,
  mine,
  tail,
  author,
  repliedTo,
  onForward,
}: {
  message: Message;
  mine: boolean;
  tail: boolean;
  author?: Contact;
  repliedTo?: Message;
  onForward?: (m: Message) => void;
}) {
  const react = useChatStore((s) => s.react);
  const setReply = useChatStore((s) => s.setReply);
  const deleteForEveryone = useChatStore((s) => s.deleteForEveryone);
  const hideForMe = useChatStore((s) => s.hideForMe);
  const contacts = useChatStore((s) => s.contacts);
  const showToast = useUIStore((s) => s.showToast);

  const [lightbox, setLightbox] = useState(false);
  const [bar, setBar] = useState(false);
  const [menu, setMenu] = useState(false);
  const isImage = message.kind === "image";
  const media = useCachedMedia(message);

  const addReaction = (emoji: string) => {
    react(message.conversationId, message.id, emoji);
    setBar(false);
  };

  if (message.deleted) {
    return (
      <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
        <div className="flex max-w-[74%] items-center gap-2 rounded-[var(--radius-bubble)] border border-dashed border-line px-3.5 py-2.5 text-[13px] italic text-faint">
          <Ban size={14} /> This message was deleted
        </div>
      </div>
    );
  }

  const replyAuthor =
    repliedTo && (repliedTo.authorId === ME ? "You" : contacts[repliedTo.authorId]?.name ?? "Unknown");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn("group flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[74%] flex-col", mine ? "items-end" : "items-start")}>
        {author && !mine && (
          <span className="mb-0.5 pl-1 text-[11px] font-medium" style={{ color: `hsl(${author.hue} 80% 70%)` }}>
            {author.name}
          </span>
        )}

        <div className="relative" onDoubleClick={() => addReaction("❤️")}>
          <div
            className={cn(
              "relative text-[14px] leading-relaxed",
              isImage && !repliedTo ? "overflow-hidden p-1" : "px-3.5 py-2.5",
              mine ? "text-white" : "glass text-text",
            )}
            style={{
              borderRadius: "var(--radius-bubble)",
              ...(tail ? (mine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }) : {}),
              ...(mine
                ? {
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 92%, #fff 0%), color-mix(in srgb, var(--color-violet) 88%, #000 0%))",
                    boxShadow: "0 8px 24px -12px var(--color-violet)",
                  }
                : {}),
            }}
          >
            {repliedTo && (
              <div
                className={cn(
                  "mb-1.5 rounded-lg border-l-2 px-2.5 py-1.5 text-[12px]",
                  mine ? "bg-black/15 border-white/60" : "bg-white/[0.05] border-accent",
                )}
              >
                <div className={cn("font-medium", mine ? "text-white/90" : "text-accent")}>{replyAuthor}</div>
                <div className={cn("truncate", mine ? "text-white/70" : "text-muted")}>{snippet(repliedTo)}</div>
              </div>
            )}

            {message.kind === "text" && (
              <span className="select-text whitespace-pre-wrap break-words">{message.text}</span>
            )}

            {isImage &&
              (media ? (
                <button type="button" onClick={() => setLightbox(true)} className="block">
                  <img
                    src={media}
                    alt={message.attachment?.name ?? "photo"}
                    className="max-h-72 w-full rounded-[14px] object-cover"
                  />
                </button>
              ) : (
                <MediaGone label="Photo is on its original device" />
              ))}

            {message.kind === "file" && message.attachment && (
              <div className="flex items-center gap-3 py-1 pr-2">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: mine ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)" }}
                >
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{message.attachment.name}</div>
                  <div className={cn("text-[12px]", mine ? "text-white/70" : "text-faint")}>
                    {fileSize(message.attachment.size)}
                    {!media && " · only on original device"}
                  </div>
                </div>
                {media && (
                  <a
                    href={media}
                    download={message.attachment.name}
                    aria-label="Download"
                    className={cn("ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg", mine ? "hover:bg-white/20" : "hover:bg-white/10")}
                  >
                    <Download size={16} />
                  </a>
                )}
              </div>
            )}

            {message.kind === "voice" && message.voice && (
              <div className="py-0.5">
                {media ? (
                  <VoiceMessage voice={{ ...message.voice, url: media }} mine={mine} />
                ) : (
                  <MediaGone label="Voice note is on its original device" />
                )}
              </div>
            )}

            <span
              className={cn(
                "float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-1 text-[10px]",
                mine ? "text-white/60" : "text-faint",
              )}
            >
              {clock(message.ts)}
              {mine && <StatusTick status={message.status} />}
            </span>
          </div>

          {/* Hover actions */}
          <div
            className={cn(
              "absolute top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100",
              mine ? "-left-[68px]" : "-right-[68px]",
            )}
          >
            <button
              type="button"
              aria-label="React"
              onClick={() => { setBar((v) => !v); setMenu(false); }}
              className="grid h-7 w-7 place-items-center rounded-full border border-line bg-surface/90 text-muted backdrop-blur hover:text-text"
            >
              <SmilePlus size={15} />
            </button>
            <button
              type="button"
              aria-label="More"
              onClick={() => { setMenu((v) => !v); setBar(false); }}
              className="grid h-7 w-7 place-items-center rounded-full border border-line bg-surface/90 text-muted backdrop-blur hover:text-text"
            >
              <MoreVertical size={15} />
            </button>
          </div>

          <AnimatePresence>
            {bar && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBar(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className={cn("glass-panel absolute bottom-full z-20 mb-2 flex gap-1 rounded-full p-1.5", mine ? "right-0" : "left-0")}
                >
                  {QUICK.map((e) => (
                    <button key={e} type="button" onClick={() => addReaction(e)} className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-white/10">
                      {e}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 480, damping: 28 }}
                  className={cn("glass-panel absolute bottom-full z-20 mb-2 w-44 rounded-2xl p-1.5", mine ? "right-0" : "left-0")}
                >
                  <MenuRow icon={<Reply size={15} />} label="Reply" onClick={() => { setReply(message.conversationId, message); setMenu(false); }} />
                  <MenuRow icon={<Forward size={15} />} label="Forward" onClick={() => { onForward?.(message); setMenu(false); }} />
                  {message.kind === "text" && (
                    <MenuRow icon={<Copy size={15} />} label="Copy" onClick={() => { navigator.clipboard?.writeText(message.text ?? ""); showToast("Copied"); setMenu(false); }} />
                  )}
                  <MenuRow icon={<Trash2 size={15} />} label="Delete for me" onClick={() => { hideForMe(message.conversationId, message.id); setMenu(false); }} />
                  {mine && (
                    <MenuRow danger icon={<Trash2 size={15} />} label="Delete for everyone" onClick={() => { deleteForEveryone(message.conversationId, message.id); setMenu(false); }} />
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className={cn("-mt-1 flex flex-wrap gap-1", mine ? "justify-end pr-1" : "pl-1")}>
            {message.reactions.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => react(message.conversationId, message.id, e)}
                className="flex items-center gap-1 rounded-full border border-line bg-surface/80 px-1.5 py-0.5 text-[12px] backdrop-blur transition-transform hover:scale-105"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {isImage && media && (
        <Modal open={lightbox} onClose={() => setLightbox(false)} width={640}>
          <img src={media} alt={message.attachment?.name ?? "photo"} className="w-full rounded-xl" />
        </Modal>
      )}
    </motion.div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
        danger ? "text-red-400 hover:bg-red-500/10" : "text-muted hover:bg-white/[0.06] hover:text-text",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MediaGone({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] text-faint">
      <ImageOff size={15} />
      {label}
    </div>
  );
}

function StatusTick({ status }: { status?: Message["status"] }) {
  if (status === "sending") return <Clock size={12} className="opacity-70" />;
  if (status === "read") return <CheckCheck size={13} className="text-cyan" />;
  if (status === "delivered") return <CheckCheck size={13} className="opacity-80" />;
  return <Check size={13} className="opacity-80" />;
}
