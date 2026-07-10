import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Attachment,
  CallLogEntry,
  Contact,
  Conversation,
  FriendRequest,
  Message,
  Presence,
  VoiceClip,
} from "../types";
import { ME } from "../data/mock";
import { supabase } from "./supabase";
import { uid } from "./format";

function sb() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

/* ----------------------------- row shapes ------------------------------ */

interface ProfileRow {
  id: string;
  name: string;
  handle: string | null;
  bio: string | null;
  status: string | null;
  hue: number | null;
  presence: string | null;
  avatar_url: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  author_id: string;
  kind: string;
  body: string | null;
  attachment: Attachment | null;
  voice: VoiceClip | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  reply_to: string | null;
  deleted: boolean | null;
}

interface CallRow {
  id: string;
  from_id: string;
  to_id: string;
  kind: string;
  status: string;
  duration: number;
  created_at: string;
}

interface RequestRow {
  id: string;
  from_id: string;
  to_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

/* ------------------------------ mappers -------------------------------- */

export function toContact(p: ProfileRow, isFriend = false): Contact {
  return {
    id: p.id,
    name: p.name || "Nyx user",
    handle: p.handle ?? "",
    hue: p.hue ?? 264,
    presence: (p.presence as Presence) ?? "offline",
    bio: p.bio ?? "",
    status: p.status ?? "",
    avatarUrl: p.avatar_url ?? undefined,
    isFriend,
  };
}

export function toMessage(row: MessageRow, myId: string): Message {
  const mine = row.author_id === myId;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: mine ? ME : row.author_id,
    kind: row.kind as Message["kind"],
    text: row.body ?? undefined,
    attachment: row.attachment ?? undefined,
    voice: row.voice ?? undefined,
    ts: new Date(row.created_at).getTime(),
    status: mine
      ? row.read_at
        ? "read"
        : row.delivered_at
          ? "delivered"
          : "sent"
      : undefined,
    replyTo: row.reply_to ?? undefined,
    deleted: row.deleted ?? undefined,
  };
}

export function toCall(row: CallRow, myId: string): CallLogEntry {
  const outgoing = row.from_id === myId;
  const status = row.status as "completed" | "missed" | "declined";
  return {
    id: row.id,
    contactId: outgoing ? row.to_id : row.from_id,
    kind: row.kind as "voice" | "video",
    direction: status === "missed" || status === "declined" ? "missed" : outgoing ? "outgoing" : "incoming",
    status,
    ts: new Date(row.created_at).getTime(),
    duration: row.duration,
  };
}

export async function fetchCalls(myId: string): Promise<CallLogEntry[]> {
  const { data } = await sb()
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as CallRow[]).map((r) => toCall(r, myId));
}

export async function insertCall(
  myId: string,
  toId: string,
  kind: "voice" | "video",
  status: "completed" | "missed" | "declined",
  duration: number,
): Promise<CallLogEntry | null> {
  const { data } = await sb()
    .from("calls")
    .insert({ from_id: myId, to_id: toId, kind, status, duration: Math.round(duration) })
    .select()
    .single();
  return data ? toCall(data as CallRow, myId) : null;
}

export function subscribeCalls(onInsert: (row: unknown) => void): RealtimeChannel {
  return sb()
    .channel("db:calls")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "calls" },
      (payload) => onInsert(payload.new),
    )
    .subscribe();
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await sb().rpc("delete_message", { p_id: id });
  if (error) throw error;
}

/* ------------------------------ profiles ------------------------------- */

const PROFILE_COLS = "id,name,handle,bio,status,hue,presence,avatar_url";

/** Accepted friends + anyone sharing a conversation with me. */
export async function fetchContacts(myId: string): Promise<Contact[]> {
  const { data: reqs } = await sb()
    .from("friend_requests")
    .select("from_id,to_id,status")
    .eq("status", "accepted");
  const friendIds = new Set(
    (reqs ?? []).map((r) => (r.from_id === myId ? r.to_id : r.from_id) as string),
  );

  const { data: members } = await sb()
    .from("conversation_members")
    .select("user_id");
  const peerIds = new Set(
    ((members ?? []).map((m) => m.user_id as string)).filter((u) => u !== myId),
  );

  const all = [...new Set([...friendIds, ...peerIds])];
  if (all.length === 0) return [];
  const { data } = await sb().from("profiles").select(PROFILE_COLS).in("id", all);
  return ((data ?? []) as ProfileRow[]).map((p) => toContact(p, friendIds.has(p.id)));
}

export async function findByHandle(handle: string): Promise<Contact | null> {
  const { data, error } = await sb().rpc("find_by_handle", { p_handle: handle });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return toContact({ ...row, status: null, presence: null } as ProfileRow, false);
}

/* --------------------------- friend requests --------------------------- */

export async function fetchRequests(myId: string): Promise<FriendRequest[]> {
  const { data } = await sb()
    .from("friend_requests")
    .select("*")
    .in("status", ["pending"])
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as RequestRow[];
  if (rows.length === 0) return [];

  const peerIds = [...new Set(rows.map((r) => (r.from_id === myId ? r.to_id : r.from_id)))];
  const { data: profs } = await sb().from("profiles").select(PROFILE_COLS).in("id", peerIds);
  const byId = Object.fromEntries(
    ((profs ?? []) as ProfileRow[]).map((p) => [p.id, toContact(p)]),
  );

  return rows.map((r) => ({
    id: r.id,
    fromId: r.from_id,
    toId: r.to_id,
    status: r.status,
    ts: new Date(r.created_at).getTime(),
    peer: byId[r.from_id === myId ? r.to_id : r.from_id],
  }));
}

export async function sendFriendRequest(handle: string): Promise<void> {
  const { error } = await sb().rpc("send_friend_request", { p_handle: handle });
  if (error) throw error;
}

export async function respondFriendRequest(id: string, accept: boolean): Promise<void> {
  const { error } = await sb().rpc("respond_friend_request", { p_id: id, p_accept: accept });
  if (error) throw error;
}

/* ---------------------------- conversations ---------------------------- */

export async function fetchConversations(myId: string): Promise<Conversation[]> {
  const { data: mine } = await sb()
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", myId);
  const cids = [...new Set((mine ?? []).map((r) => r.conversation_id as string))];
  if (cids.length === 0) return [];

  const [{ data: convs }, { data: members }] = await Promise.all([
    sb().from("conversations").select("id,is_group,title").in("id", cids),
    sb().from("conversation_members").select("conversation_id,user_id").in("conversation_id", cids),
  ]);

  const byConv: Record<string, string[]> = {};
  for (const m of members ?? []) {
    (byConv[m.conversation_id as string] ??= []).push(m.user_id as string);
  }

  return (convs ?? []).map((c) => {
    const ids = byConv[c.id as string] ?? [];
    const other = ids.find((u) => u !== myId) ?? myId;
    return {
      id: c.id as string,
      contactId: other,
      isGroup: !!c.is_group,
      title: (c.title as string) ?? undefined,
      memberIds: ids,
      unread: 0,
    };
  });
}

export async function fetchConversationMeta(
  cid: string,
  myId: string,
): Promise<Conversation | null> {
  const [{ data: conv }, { data: members }] = await Promise.all([
    sb().from("conversations").select("id,is_group,title").eq("id", cid).maybeSingle(),
    sb().from("conversation_members").select("user_id").eq("conversation_id", cid),
  ]);
  if (!conv) return null;
  const ids = (members ?? []).map((m) => m.user_id as string);
  if (!ids.includes(myId)) return null;
  return {
    id: cid,
    contactId: ids.find((u) => u !== myId) ?? myId,
    isGroup: !!conv.is_group,
    title: (conv.title as string) ?? undefined,
    memberIds: ids,
    unread: 0,
  };
}

export async function fetchMessages(cid: string, myId: string): Promise<Message[]> {
  const { data } = await sb()
    .from("messages")
    .select("*")
    .eq("conversation_id", cid)
    .order("created_at", { ascending: true });
  return ((data ?? []) as MessageRow[]).map((r) => toMessage(r, myId));
}

async function createConversation(
  myId: string,
  otherIds: string[],
  opts: { isGroup: boolean; title?: string },
): Promise<string> {
  // Generate the id client-side: RLS forbids reading the row back before
  // membership exists, so an insert+select round-trip would fail.
  const cid = crypto.randomUUID();
  const { error: convErr } = await sb()
    .from("conversations")
    .insert({ id: cid, is_group: opts.isGroup, title: opts.title ?? null, created_by: myId });
  if (convErr) throw convErr;
  const { error: meErr } = await sb()
    .from("conversation_members")
    .insert({ conversation_id: cid, user_id: myId });
  if (meErr) throw meErr;
  if (otherIds.length) {
    const { error: othersErr } = await sb()
      .from("conversation_members")
      .insert(otherIds.map((u) => ({ conversation_id: cid, user_id: u })));
    if (othersErr) throw othersErr;
  }
  return cid;
}

export async function ensureConversation(myId: string, otherId: string): Promise<string> {
  const existing = await fetchConversations(myId);
  const hit = existing.find(
    (c) => !c.isGroup && c.memberIds?.length === 2 && c.memberIds.includes(otherId),
  );
  if (hit) return hit.id;
  return createConversation(myId, [otherId], { isGroup: false });
}

export async function createGroup(
  myId: string,
  memberIds: string[],
  title: string,
): Promise<string> {
  return createConversation(myId, memberIds, { isGroup: true, title: title || "New group" });
}

/* ------------------------------- receipts ------------------------------ */

export async function markDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await sb().rpc("mark_delivered", { p_ids: ids });
}

export async function markRead(cid: string): Promise<void> {
  await sb().rpc("mark_read", { p_cid: cid });
}

/* -------------------------------- media -------------------------------- */

export async function uploadMedia(
  myId: string,
  blob: Blob,
  ext: string,
): Promise<{ url: string; path: string }> {
  const path = `${myId}/${uid("m")}.${ext}`;
  const { error } = await sb()
    .storage.from("media")
    .upload(path, blob, { contentType: blob.type || "application/octet-stream" });
  if (error) throw error;
  return { url: sb().storage.from("media").getPublicUrl(path).data.publicUrl, path };
}

export async function uploadAvatar(myId: string, blob: Blob): Promise<string> {
  const path = `${myId}/avatar-${Date.now()}.jpg`;
  const { error } = await sb()
    .storage.from("media")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return sb().storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Ask the server to drop its copy of a message's media (recipient calls this). */
export async function scrubMedia(msgId: string): Promise<void> {
  await sb().rpc("scrub_media", { p_id: msgId });
}

/** Fetch a blob back from a blob:/data:/https: URL. */
export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.blob();
}

/* ------------------------------- inserts ------------------------------- */

interface InsertPayload {
  kind: Message["kind"];
  body?: string;
  attachment?: Attachment;
  voice?: VoiceClip;
  replyTo?: string;
}

export async function insertMessage(
  cid: string,
  myId: string,
  p: InsertPayload,
): Promise<Message | null> {
  const { data, error } = await sb()
    .from("messages")
    .insert({
      conversation_id: cid,
      author_id: myId,
      kind: p.kind,
      body: p.body ?? null,
      attachment: p.attachment ?? null,
      voice: p.voice ?? null,
      reply_to: p.replyTo ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toMessage(data as MessageRow, myId);
}

/* ------------------------------ realtime ------------------------------- */

export function subscribeMessages(
  onInsert: (row: MessageRow) => void,
  onUpdate: (row: MessageRow) => void,
): RealtimeChannel {
  return sb()
    .channel("db:messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages" },
      (payload) => onUpdate(payload.new as MessageRow),
    )
    .subscribe();
}

export function subscribeRequests(onChange: () => void): RealtimeChannel {
  return sb()
    .channel("db:friend_requests")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_requests" },
      () => onChange(),
    )
    .subscribe();
}
