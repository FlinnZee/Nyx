import { useSettingsStore } from "../store/useSettingsStore";
import { confirmHaptic, receiveHaptic } from "./haptics";

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freqs: number[], dur = 0.13, peak = 0.05) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  freqs.forEach((f, i) => {
    const t = now + i * 0.05;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur);
  });
}

function enabled() {
  return useSettingsStore.getState().prefs.sounds;
}

export function playSend() {
  if (enabled()) blip([680, 920]);
  confirmHaptic();
}
export function playReceive() {
  if (enabled()) blip([520, 400]);
  receiveHaptic();
}
