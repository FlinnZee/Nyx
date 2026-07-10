import { motion } from "motion/react";
import { MessageCircle, Phone, Users, Settings } from "lucide-react";
import type { Section } from "../../types";
import { useUIStore } from "../../store/useUIStore";
import { useChatStore } from "../../store/useChatStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { tapHaptic } from "../../lib/haptics";
import Avatar from "../ui/Avatar";

const items: { id: Section; icon: typeof MessageCircle; label: string }[] = [
  { id: "chats", icon: MessageCircle, label: "Chats" },
  { id: "calls", icon: Phone, label: "Calls" },
  { id: "people", icon: Users, label: "People" },
  { id: "settings", icon: Settings, label: "Settings" },
];

/** Mobile navigation — floating glass dock with a gliding active pill. */
export default function BottomBar() {
  const section = useUIStore((s) => s.section);
  const setSection = useUIStore((s) => s.setSection);
  const profile = useSettingsStore((s) => s.profile);
  const unread = useChatStore((s) =>
    s.conversations.reduce((n, c) => n + c.unread, 0),
  );
  const requests = useChatStore((s) =>
    s.requests.filter((r) => r.toId === s.myId).length,
  );

  const go = (id: Section) => {
    tapHaptic();
    setSection(id);
  };

  return (
    <nav
      className="glass-panel z-30 mx-3 mb-3 flex shrink-0 items-center justify-around rounded-3xl px-2 py-2"
      style={{ marginBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {items.map(({ id, icon: Icon, label }) => {
        const active = section === id;
        const badge = id === "chats" ? unread : id === "people" ? requests : 0;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            onClick={() => go(id)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5"
          >
            {active && (
              <motion.span
                layoutId="bottom-active"
                className="absolute inset-x-2 inset-y-0 rounded-2xl border border-line-strong bg-white/[0.07]"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative">
              <Icon
                size={21}
                className={
                  "relative z-10 transition-colors " +
                  (active ? "text-accent" : "text-faint")
                }
              />
              {badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-1.5 z-10 grid h-[15px] min-w-[15px] place-items-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-violet), var(--color-magenta))",
                  }}
                >
                  {badge}
                </motion.span>
              )}
            </span>
            <span
              className={
                "relative z-10 text-[9.5px] font-medium " +
                (active ? "text-text" : "text-faint")
              }
            >
              {label}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Profile"
        onClick={() => go("profile")}
        className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5"
      >
        {section === "profile" && (
          <motion.span
            layoutId="bottom-active"
            className="absolute inset-x-2 inset-y-0 rounded-2xl border border-line-strong bg-white/[0.07]"
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
          />
        )}
        <span
          className={
            "relative z-10 rounded-full " +
            (section === "profile" ? "ring-2 ring-accent" : "ring-2 ring-transparent")
          }
        >
          <Avatar
            name={profile.name}
            hue={profile.hue}
            src={profile.avatarUrl}
            size={22}
            showPresence={false}
          />
        </span>
        <span
          className={
            "relative z-10 text-[9.5px] font-medium " +
            (section === "profile" ? "text-text" : "text-faint")
          }
        >
          You
        </span>
      </button>
    </nav>
  );
}
