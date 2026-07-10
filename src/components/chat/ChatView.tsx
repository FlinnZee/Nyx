import { useState } from "react";
import { motion } from "motion/react";
import type { Message } from "../../types";
import { useChatStore } from "../../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import ForwardModal from "./ForwardModal";
import NyxLogo from "../NyxLogo";

// Stable reference so the selector never returns a fresh array (would loop).
const EMPTY: Message[] = [];

export default function ChatView() {
  const activeId = useChatStore((s) => s.activeId);
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeId),
  );
  const contact = useChatStore((s) =>
    conversation ? s.contacts[conversation.contactId] : undefined,
  );
  const messages = useChatStore((s) => s.messages[s.activeId]) ?? EMPTY;
  const typing = useChatStore((s) => !!s.typing[s.activeId]);
  const [forwarding, setForwarding] = useState<Message | null>(null);

  if (!conversation || (!contact && !conversation.isGroup)) {
    return (
      <section className="grid flex-1 place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <NyxLogo size={64} />
          </motion.div>
          <p className="max-w-xs text-sm text-muted">
            Select a conversation to begin — or add friends from People.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col">
      <ChatHeader contact={contact} conversation={conversation} typing={typing} />
      <MessageList
        key={activeId}
        messages={messages}
        typing={typing}
        group={!!conversation.isGroup}
        onForward={setForwarding}
      />
      <Composer convId={activeId} />
      <ForwardModal message={forwarding} onClose={() => setForwarding(null)} />
    </section>
  );
}
