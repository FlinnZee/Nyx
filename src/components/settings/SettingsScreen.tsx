import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Bell,
  ShieldCheck,
  MessageSquare,
  Info,
} from "lucide-react";
import type { AccentName, ThemeName } from "../../types";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useUIStore } from "../../store/useUIStore";
import { ACCENTS } from "../../lib/accents";
import { THEMES } from "../../lib/theme";
import Toggle from "../ui/Toggle";
import AboutPanel from "./AboutPanel";

const nav = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "about", label: "About", icon: Info },
];

export default function SettingsScreen() {
  const panel = useUIStore((s) => s.settingsPanel);
  const setPanel = useUIStore((s) => s.setSettingsPanel);

  return (
    <section className="flex flex-1">
      <div className="w-56 shrink-0 border-r border-line p-3">
        <h1 className="px-3 py-3 font-display text-[22px] font-bold tracking-tight">Settings</h1>
        <div className="space-y-0.5">
          {nav.map((n) => {
            const active = panel === n.id;
            return (
              <button key={n.id} type="button" onClick={() => setPanel(n.id)} className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
                {active && <motion.span layoutId="settings-active" className="absolute inset-0 rounded-xl border border-line-strong bg-white/[0.06]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <n.icon size={17} className={"relative z-10 " + (active ? "text-accent" : "text-faint")} />
                <span className={"relative z-10 " + (active ? "text-text" : "text-muted")}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={panel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mx-auto max-w-xl"
          >
            {panel === "appearance" && <Appearance />}
            {panel === "notifications" && <Notifications />}
            {panel === "privacy" && <Privacy />}
            {panel === "chat" && <ChatSettings />}
            {panel === "about" && <AboutPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Appearance() {
  const accent = useSettingsStore((s) => s.prefs.accent);
  const theme = useSettingsStore((s) => s.prefs.theme);
  const reduceMotion = useSettingsStore((s) => s.prefs.reduceMotion);
  const compact = useSettingsStore((s) => s.prefs.compact);
  const setPref = useSettingsStore((s) => s.setPref);

  return (
    <>
      <PanelTitle title="Appearance" desc="Pick your experience — each one is a whole different Nyx." />

      <div className="mb-7">
        <div className="mb-3 text-[13px] font-medium text-muted">Experience</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {THEMES.map((t) => {
            const active = theme === t.name;
            return (
              <motion.button
                key={t.name}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPref("theme", t.name as ThemeName)}
                className={
                  "rounded-2xl border p-3 text-left transition-colors " +
                  (active ? "border-accent/70 bg-white/[0.06]" : "border-line hover:border-line-strong")
                }
              >
                <span
                  className="mb-3 block h-16 w-full rounded-xl"
                  style={{ background: t.preview, boxShadow: active ? "0 6px 20px -8px var(--color-accent)" : "none" }}
                />
                <span className={"block font-display text-[14px] font-semibold " + (active ? "text-text" : "text-muted")}>
                  {t.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-faint">{t.tagline}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {theme === "aurora" && (
        <div className="mb-6">
          <div className="mb-3 text-[13px] font-medium text-muted">Accent aurora</div>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(ACCENTS) as AccentName[]).map((name) => {
              const a = ACCENTS[name];
              const active = accent === name;
              return (
                <button key={name} type="button" onClick={() => setPref("accent", name)} className="flex flex-col items-center gap-2">
                  <span
                    className={"h-14 w-14 rounded-2xl transition-transform hover:scale-105 " + (active ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[color:var(--color-surface)]" : "")}
                    style={{ background: `linear-gradient(135deg, ${a.stops[0]}, ${a.stops[1]} 55%, ${a.stops[2]})` }}
                  />
                  <span className={"text-[12px] " + (active ? "text-text" : "text-faint")}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Row title="Reduce motion" desc="Calm the animations across the app.">
        <Toggle checked={reduceMotion} onChange={(v) => setPref("reduceMotion", v)} />
      </Row>
      <Row title="Compact density" desc="Tighter spacing to fit more on screen.">
        <Toggle checked={compact} onChange={(v) => setPref("compact", v)} />
      </Row>
    </>
  );
}

function Notifications() {
  const notifications = useSettingsStore((s) => s.prefs.notifications);
  const sounds = useSettingsStore((s) => s.prefs.sounds);
  const setPref = useSettingsStore((s) => s.setPref);
  return (
    <>
      <PanelTitle title="Notifications" desc="Choose what reaches you." />
      <Row title="Push notifications" desc="Get notified about new messages.">
        <Toggle checked={notifications} onChange={(v) => setPref("notifications", v)} />
      </Row>
      <Row title="In-app sounds" desc="Play a chime on send & receive.">
        <Toggle checked={sounds} onChange={(v) => setPref("sounds", v)} />
      </Row>
    </>
  );
}

function Privacy() {
  const readReceipts = useSettingsStore((s) => s.prefs.readReceipts);
  const showPresence = useSettingsStore((s) => s.prefs.showPresence);
  const setPref = useSettingsStore((s) => s.setPref);
  return (
    <>
      <PanelTitle title="Privacy" desc="You're in control." />
      <Row title="Read receipts" desc="Let others see when you've read.">
        <Toggle checked={readReceipts} onChange={(v) => setPref("readReceipts", v)} />
      </Row>
      <Row title="Show presence" desc="Share your online status.">
        <Toggle checked={showPresence} onChange={(v) => setPref("showPresence", v)} />
      </Row>
    </>
  );
}

function ChatSettings() {
  const enterToSend = useSettingsStore((s) => s.prefs.enterToSend);
  const setPref = useSettingsStore((s) => s.setPref);
  return (
    <>
      <PanelTitle title="Chat" desc="Tune how messaging feels." />
      <Row title="Press Enter to send" desc="Off: Enter adds a newline, Ctrl/⌘+Enter sends.">
        <Toggle checked={enterToSend} onChange={(v) => setPref("enterToSend", v)} />
      </Row>
    </>
  );
}

function PanelTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
      <div className="min-w-0">
        <div className="font-medium text-text">{title}</div>
        <div className="text-[13px] text-muted">{desc}</div>
      </div>
      {children}
    </div>
  );
}
