import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, PenSquare } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import ConversationRow from "./ConversationRow";
import NewChatModal from "./NewChatModal";

export default function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const contacts = useChatStore((s) => s.contacts);
  const messages = useChatStore((s) => s.messages);
  const activeId = useChatStore((s) => s.activeId);
  const search = useChatStore((s) => s.search);
  const setActive = useChatStore((s) => s.setActive);
  const setSearch = useChatStore((s) => s.setSearch);
  const [compose, setCompose] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .map((c) => {
        const list = messages[c.id] ?? [];
        return { conv: c, contact: contacts[c.contactId], last: list[list.length - 1] };
      })
      .filter((r) => {
        if (!q) return true;
        const name = r.conv.isGroup ? (r.conv.title ?? "") : (r.contact?.name ?? "");
        return name.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (!!b.conv.pinned !== !!a.conv.pinned) return a.conv.pinned ? -1 : 1;
        return (b.last?.ts ?? 0) - (a.last?.ts ?? 0);
      });
  }, [conversations, contacts, messages, search]);

  return (
    <aside className="flex w-[330px] shrink-0 flex-col border-r border-line">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="font-display text-[22px] font-bold tracking-tight">Messages</h1>
        <button
          type="button"
          title="New chat or group"
          onClick={() => setCompose(true)}
          className="ring-focus grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-line-strong hover:text-text"
        >
          <PenSquare size={17} />
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="group flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 transition-colors focus-within:border-accent/60 focus-within:bg-white/[0.05]">
          <Search size={16} className="text-faint transition-colors group-focus-within:text-accent" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent py-2.5 text-sm text-text placeholder:text-faint focus:outline-none"
          />
        </div>
      </div>

      <div className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {rows.map(({ conv, contact, last }) => (
          <ConversationRow
            key={conv.id}
            conversation={conv}
            contact={contact}
            last={last}
            active={conv.id === activeId}
            onSelect={() => setActive(conv.id)}
          />
        ))}
        {rows.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-10 text-center text-sm text-faint"
          >
            {search ? `No conversations match “${search}”.` : "No chats yet — add friends in People, then start a chat."}
          </motion.p>
        )}
      </div>

      <NewChatModal open={compose} onClose={() => setCompose(false)} />
    </aside>
  );
}
