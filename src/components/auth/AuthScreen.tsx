import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MailCheck, QrCode } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import AuthShell from "./AuthShell";
import LinkDeviceQR from "./LinkDeviceQR";

export default function AuthScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const notice = useAuthStore((s) => s.notice);

  const [mode, setMode] = useState<"in" | "up" | "link">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // After a successful sign-up, guide the person straight to sign-in.
  useEffect(() => {
    if (notice) setMode("in");
  }, [notice]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "in") signIn(email, password);
    else signUp(email, password);
  };

  if (mode === "link") {
    return (
      <AuthShell title="Link this device" subtitle="Sign in from another device">
        <LinkDeviceQR />
        <div className="mt-5 border-t border-line pt-4 text-center">
          <button
            type="button"
            onClick={() => setMode("in")}
            className="text-[13px] text-faint transition-colors hover:text-muted"
          >
            ← Back to sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={mode === "in" ? "Welcome back" : "Join Nyx"}
      subtitle={mode === "in" ? "Sign in to continue" : "Create your account"}
    >
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px]"
            style={{
              borderColor: "color-mix(in srgb, var(--color-online) 40%, transparent)",
              background: "color-mix(in srgb, var(--color-online) 10%, transparent)",
              color: "var(--color-online)",
            }}
          >
            <MailCheck size={16} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="nyx-input"
        />
        <input
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="nyx-input"
        />

        {error && <p className="text-[13px] text-magenta">{error}</p>}

        <motion.button
          type="submit"
          disabled={busy}
          whileHover={{ scale: busy ? 1 : 1.02 }}
          whileTap={{ scale: busy ? 1 : 0.98 }}
          className="w-full rounded-xl py-2.5 font-medium text-white disabled:opacity-60"
          style={{
            background:
              "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))",
            boxShadow: "0 8px 24px -10px var(--color-violet)",
          }}
        >
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </motion.button>
      </form>

      <div className="mt-4 text-center text-[13px] text-muted">
        {mode === "in" ? "New to Nyx?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="font-medium text-accent hover:underline"
        >
          {mode === "in" ? "Create one" : "Sign in"}
        </button>
      </div>

      {mode === "up" && (
        <p className="mt-3 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-center text-[12px] text-faint">
          Nyx is invite-only — after signing up you'll enter an invite code from a friend.
        </p>
      )}

      <button
        type="button"
        onClick={() => setMode("link")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-text"
      >
        <QrCode size={16} /> Link a device
      </button>

      <div className="mt-5 border-t border-line pt-4 text-center">
        <button
          type="button"
          onClick={enterDemo}
          className="text-[13px] text-faint transition-colors hover:text-muted"
        >
          Explore in demo mode →
        </button>
      </div>
    </AuthShell>
  );
}
