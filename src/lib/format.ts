/** Two-tone gradient derived from a base hue — the signature Nyx avatar. */
export function avatarGradient(hue: number): string {
  const a = `hsl(${hue} 85% 62%)`;
  const b = `hsl(${(hue + 55) % 360} 80% 52%)`;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

/** Short clock time, e.g. "14:07". */
export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Compact relative label for conversation rows. */
export function relativeShort(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Human file size, e.g. "2.4 MB". */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

/** mm:ss clock for call & voice durations. */
export function duration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

let counter = 0;
/** Small unique id for runtime-created records. */
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Synthesize a plausible waveform of `n` amplitude samples in 0..1. */
export function makePeaks(n: number, seed = Math.random()): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const env = Math.sin((i / n) * Math.PI); // fade in/out
    out.push(0.15 + r * 0.85 * (0.5 + env * 0.5));
  }
  return out;
}
