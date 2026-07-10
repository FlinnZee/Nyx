import { useRef, useState } from "react";
import type { VoiceClip } from "../types";

function downsample(values: number[], buckets = 48): number[] {
  if (values.length === 0) return Array(buckets).fill(0.2);
  if (values.length <= buckets) return values;
  const out: number[] = [];
  const size = values.length / buckets;
  for (let i = 0; i < buckets; i++) {
    const start = Math.floor(i * size);
    const end = Math.floor((i + 1) * size);
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j];
    out.push(sum / Math.max(1, end - start));
  }
  return out;
}

interface Recorder {
  recording: boolean;
  elapsed: number;
  peaks: number[];
  start: () => Promise<void>;
  cancel: () => void;
  stop: () => Promise<VoiceClip | null>;
}

export function useVoiceRecorder(): Recorder {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  const collected = useRef<number[]>([]);
  const startedAt = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const teardown = () => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    analyser.current = null;
  };

  const start = async () => {
    collected.current = [];
    chunks.current = [];
    startedAt.current = Date.now();
    setElapsed(0);
    setPeaks([]);
    setRecording(true);

    let live = false;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const src = ctx.createMediaStreamSource(s);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      analyser.current = an;
      recorder.current = new MediaRecorder(s);
      recorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      recorder.current.start();
      live = true;
    } catch {
      live = false;
    }

    interval.current = setInterval(() => {
      let amp: number;
      if (live && analyser.current) {
        const buf = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteFrequencyData(buf);
        let sum = 0;
        for (const v of buf) sum += v;
        amp = Math.min(1, sum / buf.length / 90);
      } else {
        amp = 0.2 + Math.random() * 0.75;
      }
      collected.current.push(amp);
      setPeaks(downsample(collected.current, 48));
      setElapsed((Date.now() - startedAt.current) / 1000);
    }, 120);
  };

  const cancel = () => {
    recorder.current?.stop();
    recorder.current = null;
    teardown();
    setRecording(false);
    setElapsed(0);
    setPeaks([]);
  };

  const stop = async (): Promise<VoiceClip | null> => {
    const secs = (Date.now() - startedAt.current) / 1000;
    const peakSnapshot = downsample(collected.current, 48);
    let url: string | undefined;

    if (recorder.current && recorder.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.current!.onstop = () => resolve();
        recorder.current!.stop();
      });
      if (chunks.current.length) {
        url = URL.createObjectURL(new Blob(chunks.current, { type: "audio/webm" }));
      }
    }
    recorder.current = null;
    teardown();
    setRecording(false);
    setElapsed(0);
    setPeaks([]);

    if (secs < 0.6) return null;
    return { duration: secs, peaks: peakSnapshot, url };
  };

  return { recording, elapsed, peaks, start, cancel, stop };
}
