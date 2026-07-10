import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { ScanLine, Keyboard, MonitorSmartphone } from "lucide-react";
import { parseLinkQr, sendSessionTo } from "../../lib/deviceLink";
import { useUIStore } from "../../store/useUIStore";
import { confirmHaptic, errorHaptic } from "../../lib/haptics";

/**
 * Settings → Devices (on a signed-in device). Scan the QR shown on a new
 * device — or type its 6-character code — to sign that device in as you.
 */
export default function DevicesPanel() {
  const showToast = useUIStore((s) => s.showToast);
  const [mode, setMode] = useState<"idle" | "scan" | "type">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});

  const link = async (c: string) => {
    if (busy) return;
    setBusy(true);
    const ok = await sendSessionTo(c.toUpperCase());
    setBusy(false);
    if (ok) {
      confirmHaptic();
      showToast("Device linked ✨");
      setMode("idle");
      setCode("");
    } else {
      errorHaptic();
      showToast("Couldn't reach that device — check the code");
    }
  };

  // Camera + QR detection (BarcodeDetector where available).
  useEffect(() => {
    if (mode !== "scan") return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) videoRef.current.srcObject = stream;

        const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(v: HTMLVideoElement): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        if (!BD) {
          showToast("No QR scanner on this device — type the code instead");
          setMode("type");
          return;
        }
        const detector = new BD({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            for (const f of found) {
              const c = parseLinkQr(f.rawValue);
              if (c) {
                link(c);
                return;
              }
            }
          } catch {
            /* frame not ready */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        showToast("Camera unavailable — type the code instead");
        setMode("type");
      }
    })();

    stopRef.current = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    return () => stopRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) link(code.trim());
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold">Devices</h2>
        <p className="mt-1 text-sm text-muted">
          Use Nyx everywhere — link a new phone or computer to this account.
        </p>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
          <MonitorSmartphone size={18} className="text-accent" /> Link a device
        </div>
        <p className="mb-5 text-[13px] leading-relaxed text-muted">
          On the new device, open Nyx and choose{" "}
          <span className="text-text">“Link a device”</span> on the sign-in
          screen. Then scan its QR here — or type its code.
        </p>

        {mode === "idle" && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("scan")}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-cyan), var(--color-violet))",
              }}
            >
              <ScanLine size={16} /> Scan QR
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-text"
            >
              <Keyboard size={16} /> Enter code
            </button>
          </div>
        )}

        {mode === "scan" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mx-auto max-w-xs overflow-hidden rounded-2xl border border-line-strong bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="aspect-square w-full object-cover" />
              <div
                className="pointer-events-none absolute inset-x-6 h-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--color-cyan), transparent)",
                  animation: "scanline 2.2s ease-in-out infinite",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="mt-4 text-[13px] text-faint hover:text-muted"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {mode === "type" && (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="flex max-w-sm gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="6-character code"
              className="nyx-input flex-1 text-center font-mono text-lg tracking-[0.35em]"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length !== 6}
              className="rounded-xl px-5 text-sm font-medium text-white disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-cyan), var(--color-violet))",
              }}
            >
              {busy ? "Linking…" : "Link"}
            </button>
          </motion.form>
        )}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-faint">
        The new device becomes this account — chats sync through your circle,
        while photos, files and voice notes stay on the devices they were sent
        or received on.
      </p>
    </>
  );
}
