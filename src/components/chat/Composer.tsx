import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Smile,
  Send,
  Mic,
  Trash2,
  Camera,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { duration as fmtDur } from "../../lib/format";
import EmojiPicker from "./EmojiPicker";
import Waveform from "./Waveform";
import CameraCapture from "./CameraCapture";

export default function Composer({ convId }: { convId: string }) {
  const draft = useChatStore((s) => s.drafts[convId] ?? "");
  const setDraft = useChatStore((s) => s.setDraft);
  const sendText = useChatStore((s) => s.sendText);
  const sendAttachment = useChatStore((s) => s.sendAttachment);
  const sendVoice = useChatStore((s) => s.sendVoice);
  const enterToSend = useSettingsStore((s) => s.prefs.enterToSend);

  const rec = useVoiceRecorder();
  const [emoji, setEmoji] = useState(false);
  const [attach, setAttach] = useState(false);
  const [camera, setCamera] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [draft]);

  const canSend = draft.trim().length > 0;
  const submit = () => {
    if (canSend) sendText(convId);
    setEmoji(false);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendAttachment(convId, {
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        url: URL.createObjectURL(file),
      });
    }
    e.target.value = "";
    setAttach(false);
  };

  const stopAndSend = async () => {
    const clip = await rec.stop();
    if (clip) sendVoice(convId, clip);
  };

  return (
    <div className="px-6 pb-5 pt-2">
      <div className="relative mx-auto max-w-3xl">
        <AnimatePresence>
          {emoji && (
            <EmojiPicker onPick={(e) => setDraft(convId, draft + e)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attach && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="glass-panel absolute bottom-full left-0 mb-3 w-44 rounded-2xl p-1.5"
            >
              <MenuItem icon={<ImageIcon size={17} />} label="Photo" onClick={() => imgInput.current?.click()} />
              <MenuItem icon={<Camera size={17} />} label="Camera" onClick={() => { setAttach(false); setCamera(true); }} />
              <MenuItem icon={<FileIcon size={17} />} label="File" onClick={() => fileInput.current?.click()} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {rec.recording ? (
            <motion.div
              key="rec"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] p-2 pl-4"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" style={{ animation: "pulse-ring 1.6s ease-out infinite" }} />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="w-10 shrink-0 text-sm tabular-nums text-text">
                {fmtDur(rec.elapsed)}
              </span>
              <div className="flex-1 overflow-hidden">
                <Waveform peaks={rec.peaks.length ? rec.peaks : [0.2]} color="var(--color-cyan)" height={26} />
              </div>
              <button type="button" onClick={rec.cancel} aria-label="Cancel recording" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-white/5 hover:text-text">
                <Trash2 size={18} />
              </button>
              <SendButton onClick={stopAndSend} />
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-end gap-2 rounded-2xl border border-line bg-white/[0.04] p-2 backdrop-blur-xl transition-colors focus-within:border-accent/50"
            >
              <IconBtn title="Attach" active={attach} onClick={() => { setAttach((v) => !v); setEmoji(false); }}>
                <Plus size={19} className={attach ? "rotate-45 transition-transform" : "transition-transform"} />
              </IconBtn>

              <textarea
                ref={ta}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(convId, e.target.value)}
                onKeyDown={(e) => {
                  const send = enterToSend ? !e.shiftKey : e.ctrlKey || e.metaKey;
                  if (e.key === "Enter" && send) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Message…"
                className="scroll-slim max-h-[140px] flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-relaxed text-text placeholder:text-faint focus:outline-none"
              />

              <IconBtn title="Emoji" active={emoji} onClick={() => { setEmoji((v) => !v); setAttach(false); }}>
                <Smile size={19} />
              </IconBtn>

              {canSend ? (
                <SendButton onClick={submit} />
              ) : (
                <IconBtn title="Record voice" onClick={rec.start}>
                  <Mic size={19} />
                </IconBtn>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input ref={imgInput} type="file" accept="image/*" hidden onChange={onFile} />
      <input ref={fileInput} type="file" hidden onChange={onFile} />

      <CameraCapture
        open={camera}
        onClose={() => setCamera(false)}
        onCapture={(url) =>
          sendAttachment(convId, {
            name: `photo-${Date.now()}.jpg`,
            size: Math.round(url.length * 0.72),
            mime: "image/jpeg",
            url,
          })
        }
      />
    </div>
  );
}

function SendButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      aria-label="Send"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))",
        boxShadow: "0 6px 22px -6px var(--color-violet)",
      }}
    >
      <Send size={17} className="-ml-0.5" />
    </motion.button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors " +
        (active ? "bg-white/10 text-text" : "text-muted hover:bg-white/5 hover:text-text")
      }
    >
      {children}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
    >
      {icon}
      {label}
    </button>
  );
}
