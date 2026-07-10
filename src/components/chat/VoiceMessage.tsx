import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { VoiceClip } from "../../types";
import { duration as fmt } from "../../lib/format";
import Waveform from "./Waveform";

export default function VoiceMessage({
  voice,
  mine,
}: {
  voice: VoiceClip;
  mine: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const raf = useRef<number | null>(null);
  const simStart = useRef(0);

  const stopSim = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const tick = () => {
    const elapsed = (Date.now() - simStart.current) / 1000;
    const p = Math.min(1, elapsed / voice.duration);
    setProgress(p);
    if (p >= 1) {
      setPlaying(false);
      setProgress(0);
      stopSim();
    } else {
      raf.current = requestAnimationFrame(tick);
    }
  };

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      audioRef.current?.pause();
      stopSim();
      return;
    }
    setPlaying(true);
    if (voice.url) {
      if (!audioRef.current) {
        const a = new Audio(voice.url);
        a.ontimeupdate = () =>
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        a.onended = () => {
          setPlaying(false);
          setProgress(0);
        };
        audioRef.current = a;
      }
      audioRef.current.play().catch(() => {
        // Fall back to a simulated scrub if playback is blocked.
        simStart.current = Date.now() - progress * voice.duration * 1000;
        raf.current = requestAnimationFrame(tick);
      });
    } else {
      simStart.current = Date.now() - progress * voice.duration * 1000;
      raf.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => () => stopSim(), []);

  const remaining = voice.duration * (1 - progress);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{
          background: mine ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="min-w-[132px] flex-1">
        <Waveform
          peaks={voice.peaks}
          progress={progress}
          color={mine ? "#ffffff" : "var(--color-cyan)"}
          dim={mine ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)"}
        />
      </div>
      <span
        className="w-9 shrink-0 text-right text-[11px] tabular-nums"
        style={{ color: mine ? "rgba(255,255,255,0.75)" : "var(--color-muted)" }}
      >
        {fmt(playing || progress > 0 ? remaining : voice.duration)}
      </span>
    </div>
  );
}
