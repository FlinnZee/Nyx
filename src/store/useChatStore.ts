import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Attachment,
  Contact,
  Conversation,
  FriendRequest,
  Message,
  VoiceClip,
} from "../types";
import {
  ME,
  cannedReplies,
  contacts as seedContacts,
  conversations as seedConversations,
  messages as seedMessages,
} from "../data/mock";
import { uid } from "../lib/format";
import { playReceive, playSend } from "../lib/sound";
import { supabase } from "../lib/supabase";
import { saveMedia } from "../lib/mediaCache";
import { notifyMessage } from "../lib/notify";
import { useUIStore } from "./useUIStore";
import {
  createGroup,
  ensureConversation,
  fetchContacts,
  fetchConversationMeta,
  fetchConversations,
  fetchMessages,
  fetchRequests,
  findByHandle,
  insertMessage,
  markDelivered,
  markRead,
  respondFriendRequest,
  scrubMedia,
  sendFriendRequest,
  subscribeMessages,
  subscribeRequests,
  toMessage,
  uploadMedia,
  urlToBlob,
  type MessageRow,
} from "../lib/chatApi";

interface ChatState {
  live: boolean;
  myId: string;
  contacts: Record<string, Contact>;
  requests: FriendRequest[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeId: string;
  drafts: Record<string, string>;
  typing: Record<string, boolean>;
  search: string;

  hydrate: (myId: string) => Promise<void>;
  teardown: () => void;

  setActive: (id: string) => void;
  openWith: (contactId: string) => void;
  startGroup: (memberIds: string[], title: string) => Promise<void>;
  setDraft: (id: string, text: string) => void;
  setSearch: (q: string) => void;
  togglePin: (id: string) => void;
  toggleMute: (id: string) => void;
  sendText: (id: string) => void;
  sendAttachment: (id: string, a: Attachment) => void;
  sendVoice: (id: string, v: VoiceClip) => void;
  react: (convId: string, msgId: string, emoji: string) => void;

  searchHandle: (handle: string) => Promise<Contact | null>;
  addByHandle: (handle: string) => Promise<void>;
  respondRequest: (id: string, accept: boolean) => Promise<void>;
  markConversationRead: (cid: string) => void;
}

let replyIndex = 0;
let msgChannel: RealtimeChannel | null = null;
let reqChannel: RealtimeChannel | null = null;
let presenceChannel: RealtimeChannel | null = null;
let typingChannel: RealtimeChannel | null = null;
const typingClear: Record<string, ReturnType<typeof setTimeout>> = {};
let lastTypingSent = 0;

const keyBy = (list: Contact[]) => Object.fromEntries(list.map((c) => [c.id, c]));

function preview(m: Message): string {
  if (m.kind === "text") return m.text ?? "";
  if (m.kind === "image") return "📷 Photo";
  if (m.kind === "voice") return "🎙️ Voice message";
  if (m.kind === "file") return `📎 ${m.attachment?.name ?? "File"}`;
  return "New message";
}

export const useChatStore = create<ChatState>((set, get) => {
  /* --------------------- demo-mode simulated delivery -------------------- */
  const deliverDemo = (id: string, msg: Message) => {
    playSend();
    set((s) => ({ messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), msg] } }));
    setTimeout(() => {
      set((s) => ({
        messages: {
          ...s.messages,
          [id]: (s.messages[id] ?? []).map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m)),
        },
      }));
    }, 450);
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    setTimeout(() => set((s) => ({ typing: { ...s.typing, [id]: true } })), 700);
    setTimeout(() => {
      const reply: Message = {
        id: uid(`${id}-r`),
        conversationId: id,
        authorId: conv.contactId,
        kind: "text",
        text: cannedReplies[replyIndex++ % cannedReplies.length],
        ts: Date.now(),
      };
      playReceive();
      set((s) => ({
        typing: { ...s.typing, [id]: false },
        messages: {
          ...s.messages,
          [id]: [
            ...(s.messages[id] ?? []).map((m) =>
              m.authorId === ME && m.status !== "read" ? { ...m, status: "read" as const } : m,
            ),
            reply,
          ],
        },
        conversations:
          s.activeId === id
            ? s.conversations
            : s.conversations.map((c) => (c.id === id ? { ...c, unread: c.unread + 1 } : c)),
      }));
    }, 1400 + Math.random() * 900);
  };

  const addLocal = (cid: string, msg: Message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: (s.messages[cid] ?? []).some((m) => m.id === msg.id)
          ? s.messages[cid]
          : [...(s.messages[cid] ?? []), msg],
      },
    }));

  const refreshRequests = async () => {
    const myId = get().myId;
    if (!myId) return;
    const [requests, contacts] = await Promise.all([fetchRequests(myId), fetchContacts(myId)]);
    set({ requests, contacts: keyBy(contacts) });
  };

  /* --------------------------- incoming (live) --------------------------- */
  const onIncoming = async (row: MessageRow) => {
    const st = get();
    const myId = st.myId;
    const cid = row.conversation_id;

    if (row.author_id === myId) {
      addLocal(cid, toMessage(row, myId));
      return;
    }

    let conv = st.conversations.find((c) => c.id === cid);
    if (!conv) {
      const meta = await fetchConversationMeta(cid, myId);
      if (!meta) return;
      conv = meta;
      const msgs = await fetchMessages(cid, myId);
      const contacts = keyBy(await fetchContacts(myId));
      set((s) => ({
        contacts,
        conversations: s.conversations.find((c) => c.id === cid)
          ? s.conversations
          : [meta, ...s.conversations],
        messages: { ...s.messages, [cid]: msgs },
      }));
    }

    const msg = toMessage(row, myId);

    // Device-side media: pull the blob local, then tell the server to drop it.
    const remoteUrl = row.attachment?.url ?? row.voice?.url;
    if (remoteUrl) {
      try {
        const blob = await urlToBlob(remoteUrl);
        await saveMedia(row.id, blob);
        scrubMedia(row.id).catch(() => {});
      } catch {
        // Keep the URL; we'll retry rendering from it.
      }
    }

    addLocal(cid, msg);
    const active = get().activeId === cid;
    if (!active) {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === cid ? { ...c, unread: c.unread + 1 } : c,
        ),
      }));
    }

    markDelivered([row.id]).catch(() => {});
    if (active && document.hasFocus()) markRead(cid).catch(() => {});

    playReceive();
    const from = get().contacts[msg.authorId];
    notifyMessage(from?.name ?? "Nyx", preview(msg));
  };

  const onUpdated = (row: MessageRow) => {
    const myId = get().myId;
    set((s) => ({
      messages: {
        ...s.messages,
        [row.conversation_id]: (s.messages[row.conversation_id] ?? []).map((m) =>
          m.id === row.id
            ? {
                ...toMessage(row, myId),
                // Never lose a locally-cached media reference.
                attachment: m.attachment ?? toMessage(row, myId).attachment,
                voice: m.voice ?? toMessage(row, myId).voice,
                reactions: m.reactions,
              }
            : m,
        ),
      },
    }));
  };

  return {
    live: false,
    myId: "",
    contacts: seedContacts,
    requests: [],
    conversations: seedConversations,
    messages: seedMessages,
    activeId: seedConversations[0].id,
    drafts: {},
    typing: {},
    search: "",

    hydrate: async (myId) => {
      if (!supabase) return;
      set({
        live: true,
        myId,
        contacts: {},
        requests: [],
        conversations: [],
        messages: {},
        activeId: "",
      });

      const [contacts, requests, conversations] = await Promise.all([
        fetchContacts(myId),
        fetchRequests(myId),
        fetchConversations(myId),
      ]);
      const messages: Record<string, Message[]> = {};
      await Promise.all(
        conversations.map(async (c) => {
          messages[c.id] = await fetchMessages(c.id, myId);
        }),
      );
      const sorted = [...conversations].sort((a, b) => {
        const la = messages[a.id]?.at(-1)?.ts ?? 0;
        const lb = messages[b.id]?.at(-1)?.ts ?? 0;
        return lb - la;
      });
      set({
        contacts: keyBy(contacts),
        requests,
        conversations: sorted,
        messages,
        activeId: sorted[0]?.id ?? "",
      });

      // Anything sent to me while I was offline is now delivered.
      const undelivered = Object.values(messages)
        .flat()
        .filter((m) => m.authorId !== ME && m.status === undefined)
        .map((m) => m.id);
      markDelivered(undelivered).catch(() => {});

      msgChannel?.unsubscribe();
      msgChannel = subscribeMessages(
        (row) => void onIncoming(row),
        (row) => onUpdated(row),
      );

      reqChannel?.unsubscribe();
      reqChannel = subscribeRequests(() => void refreshRequests());

      presenceChannel?.unsubscribe();
      const pc = supabase.channel("presence:nyx", { config: { presence: { key: myId } } });
      pc.on("presence", { event: "sync" }, () => {
        const online = new Set(Object.keys(pc.presenceState()));
        set((s) => ({
          contacts: Object.fromEntries(
            Object.entries(s.contacts).map(([id, c]) => [
              id,
              { ...c, presence: online.has(id) ? "online" : "offline" },
            ]),
          ),
        }));
      });
      pc.subscribe((status) => {
        if (status === "SUBSCRIBED") pc.track({ at: Date.now() });
      });
      presenceChannel = pc;

      typingChannel?.unsubscribe();
      const tc = supabase.channel("typing:nyx");
      tc.on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { cid: string; from: string };
        if (p.from === myId) return;
        set((s) => ({ typing: { ...s.typing, [p.cid]: true } }));
        clearTimeout(typingClear[p.cid]);
        typingClear[p.cid] = setTimeout(
          () => set((s) => ({ typing: { ...s.typing, [p.cid]: false } })),
          3500,
        );
      });
      tc.subscribe();
      typingChannel = tc;
    },

    teardown: () => {
      msgChannel?.unsubscribe();
      reqChannel?.unsubscribe();
      presenceChannel?.unsubscribe();
      typingChannel?.unsubscribe();
      msgChannel = reqChannel = presenceChannel = typingChannel = null;
      set({
        live: false,
        myId: "",
        contacts: {},
        requests: [],
        conversations: [],
        messages: {},
        activeId: "",
      });
    },

    setActive: (id) => {
      set((s) => ({
        activeId: id,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
      }));
      if (get().live && id) {
        markRead(id).catch(() => {});
        if (get().messages[id] === undefined) {
          fetchMessages(id, get().myId).then((msgs) =>
            set((s) => ({ messages: { ...s.messages, [id]: msgs } })),
          );
        }
      }
    },

    markConversationRead: (cid) => {
      if (get().live && cid) markRead(cid).catch(() => {});
    },

    openWith: (contactId) => {
      if (get().live) {
        const myId = get().myId;
        ensureConversation(myId, contactId)
          .then(async (cid) => {
            const meta = (await fetchConversationMeta(cid, myId)) ?? {
              id: cid,
              contactId,
              unread: 0,
            };
            set((s) => ({
              conversations: s.conversations.find((c) => c.id === cid)
                ? s.conversations
                : [meta, ...s.conversations],
              messages: { ...s.messages, [cid]: s.messages[cid] ?? [] },
              activeId: cid,
            }));
            if (!get().messages[cid]?.length) {
              const msgs = await fetchMessages(cid, myId);
              set((s) => ({ messages: { ...s.messages, [cid]: msgs } }));
            }
          })
          .catch((e) => {
            console.error("openWith failed", e);
            useUIStore.getState().showToast("Couldn't open that chat");
          });
        return;
      }
      const existing = get().conversations.find((c) => c.contactId === contactId);
      if (existing) {
        get().setActive(existing.id);
        return;
      }
      const id = `c-${contactId}`;
      set((s) => ({
        conversations: [{ id, contactId, unread: 0 }, ...s.conversations],
        messages: { ...s.messages, [id]: s.messages[id] ?? [] },
        activeId: id,
      }));
    },

    startGroup: async (memberIds, title) => {
      if (!get().live) {
        useUIStore.getState().showToast("Groups need a signed-in account");
        return;
      }
      const myId = get().myId;
      try {
        const cid = await createGroup(myId, memberIds, title);
        const meta = await fetchConversationMeta(cid, myId);
        set((s) => ({
          conversations: [meta ?? { id: cid, contactId: myId, isGroup: true, title, unread: 0 }, ...s.conversations],
          messages: { ...s.messages, [cid]: [] },
          activeId: cid,
        }));
      } catch (e) {
        console.error("startGroup failed", e);
        useUIStore.getState().showToast("Couldn't create the group");
      }
    },

    setDraft: (id, text) => {
      set((s) => ({ drafts: { ...s.drafts, [id]: text } }));
      if (get().live && text.trim() && typingChannel && Date.now() - lastTypingSent > 1200) {
        lastTypingSent = Date.now();
        typingChannel.send({
          type: "broadcast",
          event: "typing",
          payload: { cid: id, from: get().myId },
        });
      }
    },
    setSearch: (q) => set({ search: q }),

    togglePin: (id) =>
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
      })),
    toggleMute: (id) =>
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)),
      })),

    sendText: (id) => {
      const text = (get().drafts[id] ?? "").trim();
      if (!text) return;
      set((s) => ({ drafts: { ...s.drafts, [id]: "" } }));
      if (get().live) {
        playSend();
        insertMessage(id, get().myId, { kind: "text", body: text })
          .then((msg) => msg && addLocal(id, msg))
          .catch(() => useUIStore.getState().showToast("Message didn't send"));
        return;
      }
      deliverDemo(id, {
        id: uid(id),
        conversationId: id,
        authorId: ME,
        kind: "text",
        text,
        ts: Date.now(),
        status: "sending",
      });
    },

    sendAttachment: (id, attachment) => {
      const kind = attachment.mime.startsWith("image/") ? "image" : "file";
      if (get().live) {
        playSend();
        (async () => {
          const myId = get().myId;
          let att = attachment;
          let blob: Blob | null = null;
          if (attachment.url) {
            blob = await urlToBlob(attachment.url);
            const ext = (attachment.name.split(".").pop() || attachment.mime.split("/")[1] || "bin").toLowerCase();
            const up = await uploadMedia(myId, blob, ext);
            att = { ...attachment, url: up.url, path: up.path };
          }
          const msg = await insertMessage(id, myId, { kind, attachment: att });
          if (msg) {
            if (blob) await saveMedia(msg.id, blob).catch(() => {});
            addLocal(id, msg);
          }
        })().catch((e) => {
          console.error("sendAttachment failed", e);
          useUIStore.getState().showToast("Upload failed");
        });
        return;
      }
      deliverDemo(id, {
        id: uid(id),
        conversationId: id,
        authorId: ME,
        kind,
        attachment,
        ts: Date.now(),
        status: "sending",
      });
    },

    sendVoice: (id, voice) => {
      if (get().live) {
        playSend();
        (async () => {
          const myId = get().myId;
          let v = voice;
          let blob: Blob | null = null;
          if (voice.url) {
            blob = await urlToBlob(voice.url);
            const up = await uploadMedia(myId, blob, "webm");
            v = { ...voice, url: up.url, path: up.path };
          }
          const msg = await insertMessage(id, myId, { kind: "voice", voice: v });
          if (msg) {
            if (blob) await saveMedia(msg.id, blob).catch(() => {});
            addLocal(id, msg);
          }
        })().catch((e) => {
          console.error("sendVoice failed", e);
          useUIStore.getState().showToast("Voice message failed");
        });
        return;
      }
      deliverDemo(id, {
        id: uid(id),
        conversationId: id,
        authorId: ME,
        kind: "voice",
        voice,
        ts: Date.now(),
        status: "sending",
      });
    },

    react: (convId, msgId, emoji) =>
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: (s.messages[convId] ?? []).map((m) => {
            if (m.id !== msgId) return m;
            const has = m.reactions?.includes(emoji);
            const reactions = has ? m.reactions!.filter((r) => r !== emoji) : [...(m.reactions ?? []), emoji];
            return { ...m, reactions };
          }),
        },
      })),

    searchHandle: async (handle) => {
      return findByHandle(handle);
    },

    addByHandle: async (handle) => {
      await sendFriendRequest(handle);
      await refreshRequests();
    },

    respondRequest: async (id, accept) => {
      await respondFriendRequest(id, accept);
      await refreshRequests();
    },
  };
});
