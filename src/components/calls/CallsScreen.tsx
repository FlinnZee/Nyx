import { motion } from "motion/react";
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Phone,
  Video,
} from "lucide-react";
import type { CallLogEntry } from "../../types";
import { useCallStore } from "../../store/useCallStore";
import { useChatStore } from "../../store/useChatStore";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import { duration as fmtDur, relativeShort } from "../../lib/format";

function DirIcon({ e }: { e: CallLogEntry }) {
  if (e.direction === "missed") return <PhoneMissed size={14} className="text-magenta" />;
  if (e.direction === "incoming") return <PhoneIncoming size={14} className="text-online" />;
  return <PhoneOutgoing size={14} className="text-cyan" />;
}

export default function CallsScreen() {
  const log = useCallStore((s) => s.log);
  const start = useCallStore((s) => s.start);
  const contacts = useChatStore((s) => s.contacts);
  const sorted = [...log].sort((a, b) => b.ts - a.ts);

  return (
    <section className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-4 pt-6 md:px-8 md:pt-7">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Calls</h1>
          <p className="text-sm text-muted">Your recent voice & video calls</p>
        </div>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-3 pb-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-1">
          {sorted.map((e, i) => {
            const c = contacts[e.contactId];
            if (!c) return null;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), type: "spring", stiffness: 320, damping: 30 }}
                className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                <Avatar name={c.name} hue={c.hue} presence={c.presence} size={46} />
                <div className="min-w-0 flex-1">
                  <div className={"truncate font-medium " + (e.direction === "missed" ? "text-magenta" : "text-text")}>
                    {c.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                    <DirIcon e={e} />
                    <span className="capitalize">{e.kind}</span>
                    <span className="text-faint">·</span>
                    <span>{relativeShort(e.ts)}</span>
                    {e.duration > 0 && (
                      <>
                        <span className="text-faint">·</span>
                        <span>{fmtDur(e.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton title="Voice call" size={38} onClick={() => start(e.contactId, "voice")}>
                    <Phone size={17} />
                  </IconButton>
                  <IconButton title="Video call" size={38} onClick={() => start(e.contactId, "video")}>
                    <Video size={17} />
                  </IconButton>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
