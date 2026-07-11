import { useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Phone,
  Video,
  Search,
  UserPlus,
  Ticket,
  Copy,
  Check,
  X,
  Clock,
} from "lucide-react";
import type { Contact } from "../../types";
import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useUIStore } from "../../store/useUIStore";
import { supabase } from "../../lib/supabase";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Segmented from "../ui/Segmented";

export default function PeopleScreen() {
  const live = useChatStore((s) => s.live);
  const requests = useChatStore((s) => s.requests);
  const myId = useChatStore((s) => s.myId);
  const [tab, setTab] = useState("contacts");

  const incoming = requests.filter((r) => r.toId === myId).length;

  return (
    <section className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 pb-4 pt-6 md:flex-row md:items-center md:justify-between md:px-8 md:pt-7">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">People</h1>
          <p className="text-sm text-muted">Your circle — private by design</p>
        </div>
        {live && (
          <div className="w-full md:w-[340px]">
            <Segmented
              layoutId="people-tabs"
              value={tab}
              onChange={setTab}
              items={[
                { value: "contacts", label: "Contacts" },
                { value: "requests", label: incoming > 0 ? `Requests (${incoming})` : "Requests" },
                { value: "add", label: "Add" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-4 pb-8 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {(!live || tab === "contacts") && <ContactsTab />}
            {live && tab === "requests" && <RequestsTab />}
            {live && tab === "add" && <AddTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ------------------------------- contacts ------------------------------ */

function ContactsTab() {
  const contacts = useChatStore((s) => s.contacts);
  const live = useChatStore((s) => s.live);
  const openWith = useChatStore((s) => s.openWith);
  const startCall = useCallStore((s) => s.start);
  const setSection = useUIStore((s) => s.setSection);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return Object.values(contacts)
      .filter((c) => !live || c.isFriend)
      .filter(
        (c) =>
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.handle.toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, live, q]);

  const message = (id: string) => {
    openWith(id);
    setSection("chats");
  };

  return (
    <>
      <div className="mb-4 flex w-full items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 focus-within:border-accent/60 md:w-64">
        <Search size={16} className="text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search contacts"
          className="w-full bg-transparent py-2.5 text-sm text-text placeholder:text-faint focus:outline-none"
        />
      </div>

      {list.length === 0 ? (
        <p className="mx-auto max-w-xs py-14 text-center text-sm text-faint">
          No contacts yet. Ask a friend for their @handle and add them from the Add tab.
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}
        >
          {list.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), type: "spring", stiffness: 300, damping: 26 }}
              whileHover={{ y: -3 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={c.name} hue={c.hue} presence={c.presence} src={c.avatarUrl} size={52} />
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">{c.name}</div>
                  <div className="truncate text-[13px] text-muted">{c.handle}</div>
                </div>
              </div>
              {(c.status || c.bio) && (
                <p className="mt-3 line-clamp-2 min-h-[36px] text-[13px] text-muted">
                  {c.status || c.bio}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                <IconButton title="Message" size={38} onClick={() => message(c.id)}>
                  <MessageCircle size={17} />
                </IconButton>
                <IconButton title="Voice call" size={38} onClick={() => startCall(c.id, "voice")}>
                  <Phone size={17} />
                </IconButton>
                <IconButton title="Video call" size={38} onClick={() => startCall(c.id, "video")}>
                  <Video size={17} />
                </IconButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------- requests ------------------------------ */

function RequestsTab() {
  const requests = useChatStore((s) => s.requests);
  const myId = useChatStore((s) => s.myId);
  const respond = useChatStore((s) => s.respondRequest);
  const showToast = useUIStore((s) => s.showToast);

  const incoming = requests.filter((r) => r.toId === myId);
  const outgoing = requests.filter((r) => r.fromId === myId);

  const act = async (id: string, accept: boolean) => {
    try {
      await respond(id, accept);
      showToast(accept ? "Friend added ✨" : "Request declined");
    } catch {
      showToast("Something went wrong");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h3 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-faint">
          Incoming
        </h3>
        {incoming.length === 0 ? (
          <p className="text-sm text-faint">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {incoming.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass flex items-center gap-3 rounded-2xl p-3"
              >
                <Avatar
                  name={r.peer?.name ?? "Someone"}
                  hue={r.peer?.hue ?? 220}
                  src={r.peer?.avatarUrl}
                  size={44}
                  showPresence={false}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-text">{r.peer?.name ?? "Someone"}</div>
                  <div className="truncate text-[12px] text-muted">
                    {r.peer?.handle} wants to connect
                  </div>
                </div>
                <IconButton title="Decline" size={38} variant="outline" onClick={() => act(r.id, false)}>
                  <X size={16} />
                </IconButton>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => act(r.id, true)}
                  className="grid h-[38px] w-[38px] place-items-center rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet))",
                  }}
                  aria-label="Accept"
                >
                  <Check size={17} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-faint">
          Sent
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-sm text-faint">Nothing waiting on others.</p>
        ) : (
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <Avatar
                  name={r.peer?.name ?? "Someone"}
                  hue={r.peer?.hue ?? 220}
                  src={r.peer?.avatarUrl}
                  size={40}
                  showPresence={false}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text">
                    {r.peer?.name ?? "Pending user"}
                  </div>
                  <div className="text-[12px] text-faint">{r.peer?.handle}</div>
                </div>
                <span className="flex items-center gap-1.5 text-[12px] text-faint">
                  <Clock size={13} /> Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- add --------------------------------- */

function AddTab() {
  const searchHandle = useChatStore((s) => s.searchHandle);
  const addByHandle = useChatStore((s) => s.addByHandle);
  const showToast = useUIStore((s) => s.showToast);

  const [q, setQ] = useState("");
  const [found, setFound] = useState<Contact | null | "none">(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true);
    setSent(false);
    try {
      const c = await searchHandle(q);
      setFound(c ?? "none");
    } catch {
      setFound("none");
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!found || found === "none" || busy) return;
    setBusy(true);
    try {
      await addByHandle(found.handle);
      setSent(true);
      showToast("Request sent ✨");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't send the request");
    } finally {
      setBusy(false);
    }
  };

  const generateInvite = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("create_invite");
    if (error || !data) {
      showToast("Couldn't create an invite");
      return;
    }
    setInvite(data as string);
  };

  const copyInvite = () => {
    if (!invite) return;
    navigator.clipboard?.writeText(invite).then(() => showToast("Invite code copied"));
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="glass rounded-3xl p-6">
        <div className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
          <UserPlus size={18} className="text-accent" /> Add by handle
        </div>
        <p className="mb-4 text-[13px] text-muted">
          People on Nyx are private — you can only find someone by their exact @handle.
        </p>
        <form onSubmit={search} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="@handle"
            className="nyx-input flex-1"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl border border-line px-4 text-sm text-muted transition-colors hover:border-line-strong hover:text-text disabled:opacity-50"
          >
            Search
          </button>
        </form>

        <AnimatePresence mode="wait">
          {found === "none" && (
            <motion.p
              key="none"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-sm text-faint"
            >
              No one with that handle. Double-check it with your friend.
            </motion.p>
          )}
          {found && found !== "none" && (
            <motion.div
              key={found.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3"
            >
              <Avatar name={found.name} hue={found.hue} src={found.avatarUrl} size={46} showPresence={false} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-text">{found.name}</div>
                <div className="truncate text-[12px] text-muted">{found.handle}</div>
              </div>
              <motion.button
                type="button"
                onClick={add}
                disabled={busy || sent}
                whileTap={{ scale: 0.96 }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet))",
                }}
              >
                {sent ? "Sent ✓" : "Send request"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
          <Ticket size={18} className="text-accent" /> Invite a friend to Nyx
        </div>
        <p className="mb-4 text-[13px] text-muted">
          New here means invited — generate a one-time code and send it to a friend so they can
          join.
        </p>
        {invite ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-line bg-white/[0.04] px-4 py-3 font-mono text-lg tracking-widest text-accent">
              {invite}
            </code>
            <IconButton title="Copy code" variant="outline" onClick={copyInvite}>
              <Copy size={17} />
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateInvite}
            className="rounded-xl border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-text"
          >
            Generate invite code
          </button>
        )}
      </div>
    </div>
  );
}
