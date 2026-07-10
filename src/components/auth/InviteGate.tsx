import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useAuthStore } from "../../store/useAuthStore";
import AuthShell from "./AuthShell";

export default function InviteGate() {
  const redeem = useAuthStore((s) => s.redeemInvite);
  const signOut = useAuthStore((s) => s.signOut);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!code || !name || !handle) return;
    redeem(code, name, handle);
  };

  return (
    <AuthShell title="You're almost in" subtitle="Enter your invite code to join the circle">
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} className="nyx-input uppercase" />
        <input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} className="nyx-input" />
        <input placeholder="Handle (e.g. dr.v0id)" value={handle} onChange={(e) => setHandle(e.target.value)} className="nyx-input" />

        {error && <p className="text-[13px] text-magenta">{error}</p>}

        <motion.button
          type="submit"
          disabled={busy}
          whileHover={{ scale: busy ? 1 : 1.02 }}
          whileTap={{ scale: busy ? 1 : 0.98 }}
          className="w-full rounded-xl py-2.5 font-medium text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))",
            boxShadow: "0 8px 24px -10px var(--color-violet)",
          }}
        >
          {busy ? "Joining…" : "Join Nyx"}
        </motion.button>
      </form>

      <p className="mt-3 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-center text-[12px] text-faint">
        Invite codes come from people already on Nyx — ask your friend for one.
      </p>

      <div className="mt-5 border-t border-line pt-4 text-center">
        <button type="button" onClick={signOut} className="text-[13px] text-faint transition-colors hover:text-muted">
          Sign out
        </button>
      </div>
    </AuthShell>
  );
}
