import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import type { Message } from "../../types";
import { ME } from "../../data/mock";
import { useChatStore } from "../../store/useChatStore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

export default function MessageList({
  messages,
  typing,
  group = false,
  onForward,
}: {
  messages: Message[];
  typing: boolean;
  group?: boolean;
  onForward?: (m: Message) => void;
}) {
  const contacts = useChatStore((s) => s.contacts);
  const hidden = useChatStore((s) => s.hidden);
  const bottomRef = useRef<HTMLDivElement>(null);

  const visible = messages.filter((m) => !hidden[m.id]);
  const byId = new Map(messages.map((m) => [m.id, m]));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length, typing]);

  return (
    <div className="scroll-slim flex-1 overflow-y-auto px-6 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
        {visible.map((m, i) => {
          const prev = visible[i - 1];
          const next = visible[i + 1];
          const mine = m.authorId === ME;
          const tail = !next || next.authorId !== m.authorId;
          const newDay = !prev || dayLabel(prev.ts) !== dayLabel(m.ts);
          const gap = prev && prev.authorId !== m.authorId ? "mt-2.5" : "";

          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-faint">
                    {dayLabel(m.ts)}
                  </span>
                </div>
              )}
              <div className={gap}>
                <MessageBubble
                  message={m}
                  mine={mine}
                  tail={tail}
                  author={group && !mine ? contacts[m.authorId] : undefined}
                  repliedTo={m.replyTo ? byId.get(m.replyTo) : undefined}
                  onForward={onForward}
                />
              </div>
            </div>
          );
        })}

        <AnimatePresence>{typing && <TypingIndicator />}</AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
