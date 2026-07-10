import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Phone,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useChatStore } from "../../store/useChatStore";
import Avatar from "../ui/Avatar";
import { avatarGradient, duration as fmtDur } from "../../lib/format";

export default function CallOverlay() {
  const hasCall = useCallStore((s) => !!s.active);
  return (
    <AnimatePresence>
      {hasCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center"
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-2xl" />
          <CallSurface />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CallSurface() {
  const active = useCallStore((s) => s.active);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const { accept, decline, end, toggleMute, toggleCamera, toggleSpeaker } = useCallStore.getState();
  const contacts = useChatStore((s) => s.contacts);

  const [, setTick] = useState(0);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const selfVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);

  const isActive = active?.status === "active";
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isActive]);

  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    if (remoteAudio.current) remoteAudio.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    if (selfVideo.current) selfVideo.current.srcObject = localStream;
  }, [localStream]);

  if (!active) return null;
  const contact = contacts[active.contactId];
  const name = contact?.name ?? "Nyx user";
  const hue = contact?.hue ?? 264;

  const incoming = active.status === "incoming";
  const isVideo = active.kind === "video";
  const showRemoteVideo = isVideo && !!remoteStream;

  const status = incoming
    ? `Incoming ${active.kind} call…`
    : active.status === "outgoing"
      ? "Calling…"
      : active.status === "connecting"
        ? "Connecting…"
        : active.startedAt
          ? fmtDur((Date.now() - active.startedAt) / 1000)
          : "Connected";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.94, opacity: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="glass-panel relative z-10 flex h-[560px] w-[420px] max-w-full flex-col items-center overflow-hidden rounded-3xl"
    >
      <div className="absolute inset-0 opacity-60" style={{ background: avatarGradient(hue), filter: "blur(60px)" }} />
      {showRemoteVideo && (
        <video ref={remoteVideo} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
      )}
      <audio ref={remoteAudio} autoPlay className="hidden" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {showRemoteVideo ? (
          <div className="absolute right-4 top-4 h-36 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black/40">
            {active.cameraOn ? (
              <video ref={selfVideo} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[11px] text-white/60">Camera off</div>
            )}
          </div>
        ) : (
          <div className="relative grid place-items-center">
            {isActive && (
              <>
                <span className="absolute h-32 w-32 rounded-full border border-white/25" style={{ animation: "pulse-ring 2.4s ease-out infinite" }} />
                <span className="absolute h-32 w-32 rounded-full border border-white/25" style={{ animation: "pulse-ring 2.4s ease-out infinite", animationDelay: "1.2s" }} />
              </>
            )}
            <Avatar name={name} hue={hue} size={132} showPresence={false} />
          </div>
        )}

        {!showRemoteVideo && (
          <>
            <h2 className="mt-6 font-display text-2xl font-semibold text-white">{name}</h2>
            <p className="mt-1 text-sm text-white/70">{status}</p>
            {isActive && active.kind === "voice" && <Visualizer />}
          </>
        )}
        {showRemoteVideo && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-1.5 text-sm text-white backdrop-blur">
            {name} · {status}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-4 pb-9">
        {incoming ? (
          <>
            <motion.button type="button" onClick={decline} aria-label="Decline" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-[0_10px_30px_-8px_rgba(239,68,68,0.8)]">
              <PhoneOff size={24} />
            </motion.button>
            <motion.button type="button" onClick={accept} aria-label="Accept" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="grid h-16 w-16 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--color-cyan), var(--color-online))", boxShadow: "0 10px 30px -8px var(--color-online)" }}>
              <Phone size={24} />
            </motion.button>
          </>
        ) : (
          <>
            <CtrlButton label={active.muted ? "Unmute" : "Mute"} onClick={toggleMute} on={active.muted}>
              {active.muted ? <MicOff size={20} /> : <Mic size={20} />}
            </CtrlButton>
            {active.kind === "video" ? (
              <CtrlButton label="Camera" onClick={toggleCamera} on={!active.cameraOn}>
                {active.cameraOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
              </CtrlButton>
            ) : (
              <CtrlButton label="Speaker" onClick={toggleSpeaker} on={!active.speakerOn}>
                {active.speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </CtrlButton>
            )}
            <motion.button type="button" onClick={end} aria-label="End call" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-[0_10px_30px_-8px_rgba(239,68,68,0.8)]">
              <PhoneOff size={24} />
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CtrlButton({ children, onClick, label, on }: { children: ReactNode; onClick: () => void; label: string; on?: boolean }) {
  return (
    <motion.button type="button" onClick={onClick} aria-label={label} title={label} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className={"grid h-14 w-14 place-items-center rounded-full backdrop-blur-md transition-colors " + (on ? "bg-white text-ink" : "bg-white/15 text-white hover:bg-white/25")}>
      {children}
    </motion.button>
  );
}

function Visualizer() {
  return (
    <div className="mt-6 flex items-end gap-1.5" style={{ height: 28 }}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.span key={i} className="w-1.5 rounded-full bg-white/80" animate={{ height: [6, 24, 10, 28, 8] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.09, ease: "easeInOut" }} style={{ height: 6 }} />
      ))}
    </div>
  );
}
