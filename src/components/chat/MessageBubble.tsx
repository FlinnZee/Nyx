import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  ImageOff,
  SmilePlus,
} from "lucide-react";
import type { Contact, Message } from "../../types";
import { clock, fileSize } from "../../lib/format";
import { cn } from "../../lib/cn";
import { useChatStore } from "../../store/useChatStore";
import { useCachedMedia } from "../../hooks/useCachedMedia";
import VoiceMessage from "./VoiceMessage";
import Modal from "../ui/Modal";

const QUICK = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

export default function MessageBubble({
  message,
  mine,
  tail,
  author,
}: {
  message: Message;
  mine: boolean;
  tail: boolean;
  /** Shown above the bubble in group chats. */
  author?: Contact;
}) {
  const react = useChatStore((s) => s.react);
  const [lightbox, setLightbox] = useState(false);
  const [bar, setBar] = useState(false);
  const isImage = message.kind === "image";
  const media = useCachedMedia(message);

  const addReaction = (emoji: string) => {
    react(message.conversationId, message.id, emoji);
    setBar(false);
  };

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
          <span
            className="mb-0.5 pl-1 text-[11px] font-medium"
            style={{ color: `hsl(${author.hue} 80% 70%)` }}
          >
            {author.name}
          </span>
        )}

        <div className="relative" onDoubleClick={() => addReaction("❤️")}>
          <div
            className={cn(
              "relative text-[14px] leading-relaxed",
              isImage ? "overflow-hidden p-1" : "px-3.5 py-2.5",
              mine ? "text-white" : "glass text-text",
            )}
            style={{
              borderRadius: "var(--radius-bubble)",
              ...(tail
                ? mine
                  ? { borderBottomRightRadius: 6 }
                  : { borderBottomLeftRadius: 6 }
                : {}),
              ...(mine
                ? {
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 92%, #fff 0%), color-mix(in srgb, var(--color-violet) 88%, #000 0%))",
                    boxShadow: "0 8px 24px -12px var(--color-violet)",
                  }
                : {}),
            }}
          >
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
                    className={cn(
                      "ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      mine ? "hover:bg-white/20" : "hover:bg-white/10",
                    )}
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

            {isImage && media ? (
              <span className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
                {clock(message.ts)}
                {mine && <StatusTick status={message.status} />}
              </span>
            ) : (
              <span
                className={cn(
                  "float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-1 text-[10px]",
                  mine ? "text-white/60" : "text-faint",
                )}
              >
                {clock(message.ts)}
                {mine && <StatusTick status={message.status} />}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="React"
            onClick={() => setBar((v) => !v)}
            className={cn(
              "absolute top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 text-muted opacity-0 backdrop-blur transition-opacity hover:text-text group-hover:opacity-100",
              mine ? "-left-9" : "-right-9",
            )}
          >
            <SmilePlus size={15} />
          </button>

          <AnimatePresence>
            {bar && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBar(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className={cn(
                    "glass-panel absolute bottom-full z-20 mb-2 flex gap-1 rounded-full p-1.5",
                    mine ? "right-0" : "left-0",
                  )}
                >
                  {QUICK.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => addReaction(e)}
                      className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-white/10"
                    >
                      {e}
                    </button>
                  ))}
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
