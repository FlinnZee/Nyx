import type { ReactNode } from "react";
import { motion } from "motion/react";
import { MessageCircle, Phone, Users, Settings } from "lucide-react";
import type { Section } from "../../types";
import { useUIStore } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import Avatar from "../ui/Avatar";
import NyxLogo from "../NyxLogo";

const items: { id: Section; icon: typeof MessageCircle; label: string }[] = [
  { id: "chats", icon: MessageCircle, label: "Chats" },
  { id: "calls", icon: Phone, label: "Calls" },
  { id: "people", icon: Users, label: "People" },
];

export default function AppRail() {
  const section = useUIStore((s) => s.section);
  const setSection = useUIStore((s) => s.setSection);
  const profile = useSettingsStore((s) => s.profile);

  return (
    <nav className="flex w-[74px] shrink-0 flex-col items-center gap-1 border-r border-line py-3">
      <div className="mb-2 mt-1">
        <NyxLogo size={26} />
      </div>

      <div className="flex flex-1 flex-col items-center gap-1 pt-1">
        {items.map(({ id, icon: Icon, label }) => (
          <RailButton key={id} active={section === id} label={label} onClick={() => setSection(id)}>
            <Icon size={21} />
          </RailButton>
        ))}
      </div>

      <RailButton active={section === "settings"} label="Settings" onClick={() => setSection("settings")}>
        <Settings size={20} />
      </RailButton>

      <button
        type="button"
        title="Profile"
        onClick={() => setSection("profile")}
        className="relative mt-1 grid h-12 w-12 place-items-center rounded-2xl"
      >
        {section === "profile" && (
          <motion.span layoutId="rail-active-bar" className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent" style={{ boxShadow: "0 0 12px var(--color-accent)" }} />
        )}
        <span className={section === "profile" ? "rounded-full ring-2 ring-accent" : "rounded-full ring-2 ring-transparent"}>
          <Avatar name={profile.name} hue={profile.hue} presence={profile.presence} src={profile.avatarUrl} size={36} showPresence={false} />
        </span>
      </button>
    </nav>
  );
}

function RailButton({
  children,
  active,
  label,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="group relative grid h-12 w-12 place-items-center rounded-2xl">
      {active && (
        <>
          <motion.span layoutId="rail-active-bar" className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent" style={{ boxShadow: "0 0 12px var(--color-accent)" }} />
          <motion.span layoutId="rail-active-bg" className="absolute inset-0 rounded-2xl border border-line-strong bg-white/[0.06]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
        </>
      )}
      <span className={"relative z-10 transition-colors duration-200 " + (active ? "text-text" : "text-faint group-hover:text-muted")}>
        {children}
      </span>
    </button>
  );
}
