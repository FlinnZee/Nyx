import { useEffect, useState } from "react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { RefreshCw } from "lucide-react";
import {
  adoptSession,
  linkQrValue,
  makeLinkCode,
  waitForLink,
} from "../../lib/deviceLink";
import { useUIStore } from "../../store/useUIStore";
import { confirmHaptic } from "../../lib/haptics";

/**
 * Shown on a NOT-yet-signed-in device. Displays a QR + 6-char code; when a
 * signed-in device scans it (Settings → Devices), the session arrives and
 * this device signs in instantly.
 */
export default function LinkDeviceQR() {
  const showToast = useUIStore((s) => s.showToast);
  const [code, setCode] = useState(makeLinkCode);
  const [qr, setQr] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(linkQrValue(code), {
      width: 380,
      margin: 1,
      color: { dark: "#0a0a14", light: "#ececf5" },
    }).then(setQr);
  }, [code]);

  useEffect(() => {
    const stop = waitForLink(code, async (payload) => {
      setLinking(true);
      confirmHaptic();
      const ok = await adoptSession(payload);
      if (!ok) {
        setLinking(false);
        showToast("Link failed — try a fresh code");
        setCode(makeLinkCode());
      }
      // On success onAuthStateChange takes over and the app signs in.
    });
    return stop;
  }, [code, showToast]);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-4 max-w-[260px] text-[13px] leading-relaxed text-muted">
        On your signed-in device open{" "}
        <span className="text-text">Settings → Devices</span> and scan this
        code — or type it in.
      </p>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-line-strong bg-white/95 p-3"
        style={{ boxShadow: "0 14px 44px -18px var(--color-violet)" }}
      >
        {qr ? (
          <img src={qr} alt="Link QR" className="h-44 w-44 rounded-lg" />
        ) : (
          <div className="h-44 w-44" />
        )}
      </motion.div>

      <div className="mt-4 font-mono text-2xl font-semibold tracking-[0.3em] text-accent">
        {linking ? "Linking…" : code}
      </div>

      <button
        type="button"
        onClick={() => setCode(makeLinkCode())}
        className="mt-3 flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-muted"
      >
        <RefreshCw size={12} /> New code
      </button>
    </div>
  );
}
