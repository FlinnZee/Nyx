export type Presence = "online" | "away" | "offline";

export interface Contact {
  id: string;
  name: string;
  handle: string;
  /** Base hue (0-360) used to synthesize the gradient avatar. */
  hue: number;
  presence: Presence;
  bio?: string;
  status?: string;
  avatarUrl?: string;
  /** True when connected via an accepted friend request. */
  isFriend?: boolean;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
  ts: number;
  /** Profile snapshot of the other party, when known. */
  peer?: Contact;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type MessageKind = "text" | "image" | "file" | "voice" | "system";

export interface Attachment {
  name: string;
  size: number;
  mime: string;
  url?: string;
  /** Server storage path while the file is in transit (scrubbed after delivery). */
  path?: string;
}

export interface VoiceClip {
  duration: number;
  peaks: number[];
  url?: string;
  path?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** "me" identifies the local user. */
  authorId: string;
  kind: MessageKind;
  text?: string;
  attachment?: Attachment;
  voice?: VoiceClip;
  ts: number;
  status?: MessageStatus;
  reactions?: string[];
  /** Id of the message this one replies to. */
  replyTo?: string;
  /** Deleted for everyone (tombstone). */
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  /** For 1:1 chats, the other participant. For groups, a representative member. */
  contactId: string;
  isGroup?: boolean;
  title?: string;
  memberIds?: string[];
  pinned?: boolean;
  muted?: boolean;
  unread: number;
}

export type CallKind = "voice" | "video";
export type CallDirection = "incoming" | "outgoing" | "missed";
export type CallStatusKind = "completed" | "missed" | "declined";

export interface CallLogEntry {
  id: string;
  contactId: string;
  kind: CallKind;
  direction: CallDirection;
  status?: CallStatusKind;
  ts: number;
  duration: number;
}

export type CallStatus =
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";

export interface ActiveCall {
  contactId: string;
  kind: CallKind;
  status: CallStatus;
  startedAt?: number;
  muted: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
}

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  hue: number;
  status: string;
  presence: Presence;
  avatarUrl?: string;
}

export type AccentName = "aurora" | "ember" | "mint" | "rose" | "solar";
export type ThemeName = "aurora" | "vortex" | "bloom";

export interface Preferences {
  accent: AccentName;
  theme: ThemeName;
  reduceMotion: boolean;
  compact: boolean;
  sendOnEnter: boolean;
  notifications: boolean;
  sounds: boolean;
  haptics: boolean;
  readReceipts: boolean;
  showPresence: boolean;
  enterToSend: boolean;
}

export type Section = "chats" | "calls" | "people" | "settings" | "profile";
