import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link2, AtSign, Camera, Mail, Globe } from "lucide-react";
import type { LinkKind } from "../../data/creator";
import { creator } from "../../data/creator";
import { useUIStore } from "../../store/useUIStore";
import { avatarGradient, initials } from "../../lib/format";
import NyxLogo from "../NyxLogo";

const ICONS: Record<LinkKind, typeof Globe> = {
  github: Link2,
  x: AtSign,
  instagram: Camera,
  mail: Mail,
  globe: Globe,
};

export default function AboutPanel() {
  const showToast = useUIStore((s) => s.showToast);
  const links = creator.links.filter((l) => l.value.trim().length > 0);

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(
      () => showToast(`${label} copied`),
      () => showToast("Couldn't copy"),
    );
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold">About</h2>
      </div>

      {/* App identity */}
      <div className="glass flex flex-col items-center rounded-3xl px-6 py-8 text-center">
        <NyxLogo size={54} />
        <h3 className="aurora-text mt-4 font-display text-3xl font-bold">Nyx</h3>
        <p className="mt-1 text-sm text-muted">Version 0.4.2 — everywhere</p>
        <p className="mt-3 max-w-xs text-sm text-muted">A fluid, futuristic messaging experience — night made social.</p>
      </div>

      {/* Creator card */}
      <div className="glass relative mt-4 overflow-hidden rounded-3xl">
        <div className="h-24" style={{ background: avatarGradient(creator.hue) }} />
        <div className="px-6 pb-6">
          <div className="-mt-14 mb-3 flex justify-center">
            <Portrait />
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold">
              {creator.name} <span className="text-muted">({creator.alias})</span>
            </div>
            <div className="mt-1 text-sm text-accent">{creator.role}</div>
            {creator.location && <div className="mt-0.5 text-[13px] text-faint">{creator.location}</div>}
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{creator.tagline}</p>
          </div>

          {links.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {links.map((l) => {
                const Icon = ICONS[l.kind];
                return (
                  <button
                    key={l.kind}
                    type="button"
                    onClick={() => copy(l.label, l.value)}
                    title={`Copy ${l.label}`}
                    className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-text"
                  >
                    <Icon size={16} />
                    {l.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-faint">
        © 2026 {creator.name} ({creator.alias}). All rights reserved.
      </p>
    </>
  );
}

function Portrait() {
  const [failed, setFailed] = useState(false);
  const size = 104;

  // A different portrait greets you on every visit to this page.
  const photo = useMemo(() => {
    const list = creator.photos;
    if (list.length === 0) return null;
    const idx = Number(localStorage.getItem("nyx.portrait") ?? "0") % list.length;
    localStorage.setItem("nyx.portrait", String((idx + 1) % list.length));
    return list[idx];
  }, []);

  if (!photo || failed) {
    return (
      <div
        className="grid place-items-center rounded-full font-display text-3xl font-semibold text-white ring-4 ring-[color:var(--color-surface)]"
        style={{ width: size, height: size, background: avatarGradient(creator.hue) }}
      >
        {initials(creator.name)}
      </div>
    );
  }
  return (
    <motion.img
      key={photo}
      src={photo}
      alt={creator.name}
      onError={() => setFailed(true)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="rounded-full object-cover ring-4 ring-[color:var(--color-surface)]"
      style={{ width: size, height: size, objectPosition: "50% 18%" }}
    />
  );
}
