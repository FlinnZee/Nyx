import { useEffect, useRef, type ChangeEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { Camera } from "lucide-react";
import type { Presence } from "../../types";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useChatStore } from "../../store/useChatStore";
import { useUIStore } from "../../store/useUIStore";
import { supabase } from "../../lib/supabase";
import { uploadAvatar } from "../../lib/chatApi";
import Avatar from "../ui/Avatar";
import Segmented from "../ui/Segmented";
import NyxLogo from "../NyxLogo";
import { avatarGradient } from "../../lib/format";

const hues = [264, 210, 190, 150, 46, 28, 322, 300];

/** Downscale to a square jpeg so avatars stay tiny. */
async function toSquareJpeg(file: File, size = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.88),
  );
}

export default function ProfileScreen() {
  const profile = useSettingsStore((s) => s.profile);
  const update = useSettingsStore((s) => s.updateProfile);
  const live = useChatStore((s) => s.live);
  const myId = useChatStore((s) => s.myId);
  const showToast = useUIStore((s) => s.showToast);
  const fileRef = useRef<HTMLInputElement>(null);

  // Debounced cloud sync so friends see your profile changes.
  useEffect(() => {
    const client = supabase;
    if (!live || !client || !myId) return;
    const t = setTimeout(() => {
      client
        .from("profiles")
        .update({
          name: profile.name,
          bio: profile.bio,
          status: profile.status,
          hue: profile.hue,
          presence: profile.presence,
          avatar_url: profile.avatarUrl ?? null,
        })
        .eq("id", myId)
        .then(({ error }) => {
          if (error) console.error("profile sync failed", error);
        });
    }, 800);
    return () => clearTimeout(t);
  }, [live, myId, profile]);

  const pickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const blob = await toSquareJpeg(file);
      if (live && myId) {
        const url = await uploadAvatar(myId, blob);
        update({ avatarUrl: `${url}?v=${Date.now()}` });
      } else {
        update({ avatarUrl: URL.createObjectURL(blob) });
      }
      showToast("Profile photo updated ✨");
    } catch {
      showToast("Couldn't update the photo");
    }
  };

  return (
    <section className="scroll-slim flex-1 overflow-y-auto">
      <div className="mx-auto max-w-xl px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="glass overflow-hidden rounded-3xl"
        >
          <div className="h-28" style={{ background: avatarGradient(profile.hue) }} />
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                title="Change photo"
                className="group relative rounded-full ring-4 ring-[color:var(--color-surface)]"
              >
                <Avatar
                  name={profile.name}
                  hue={profile.hue}
                  presence={profile.presence}
                  src={profile.avatarUrl}
                  size={92}
                />
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={22} className="text-white" />
                </span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />

            <Field label="Display name">
              <input value={profile.name} onChange={(e) => update({ name: e.target.value })} className="nyx-input" />
            </Field>
            <Field label="Handle">
              <input value={profile.handle} readOnly={live} title={live ? "Handles are permanent — friends find you by it" : undefined} className="nyx-input opacity-80" onChange={(e) => !live && update({ handle: e.target.value })} />
            </Field>
            <Field label="Status">
              <input value={profile.status} onChange={(e) => update({ status: e.target.value })} placeholder="What's on your mind?" className="nyx-input" />
            </Field>
            <Field label="Bio">
              <textarea value={profile.bio} onChange={(e) => update({ bio: e.target.value })} rows={3} className="nyx-input resize-none" />
            </Field>

            <Field label="Presence">
              <Segmented
                layoutId="presence-seg"
                value={profile.presence}
                onChange={(v) => update({ presence: v as Presence })}
                items={[
                  { value: "online", label: "Online" },
                  { value: "away", label: "Away" },
                  { value: "offline", label: "Invisible" },
                ]}
              />
            </Field>

            <Field label="Avatar color">
              <div className="flex flex-wrap gap-2">
                {hues.map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-label={`Hue ${h}`}
                    onClick={() => update({ hue: h })}
                    className={"h-8 w-8 rounded-full transition-transform hover:scale-110 " + (profile.hue === h ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[color:var(--color-surface)]" : "")}
                    style={{ background: avatarGradient(h) }}
                  />
                ))}
              </div>
            </Field>
          </div>
        </motion.div>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] text-faint">
          <NyxLogo size={16} />
          <span>
            Nyx · designed & developed by <span className="text-muted">TK NiRMAL (dr.v0id)</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-faint">{label}</span>
      {children}
    </label>
  );
}
