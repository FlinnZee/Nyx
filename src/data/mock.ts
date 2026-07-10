import type {
  CallLogEntry,
  Contact,
  Conversation,
  Message,
  Profile,
} from "../types";
import { makePeaks } from "../lib/format";

const now = Date.now();
const min = 60_000;

export const ME = "me";

export const myProfile: Profile = {
  name: "TK NiRMAL",
  handle: "@dr.v0id",
  bio: "Building Nyx. Night owl. Signal in the noise.",
  hue: 264,
  status: "Crafting the aurora",
  presence: "online",
};

/** A soft gradient "photo" so image bubbles render offline. */
function photo(h1: number, h2: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='hsl(${h1} 80% 60%)'/>
    <stop offset='1' stop-color='hsl(${h2} 75% 45%)'/></linearGradient></defs>
    <rect width='640' height='420' fill='url(%23g)'/>
    <circle cx='480' cy='120' r='70' fill='rgba(255,255,255,0.25)'/>
    <circle cx='180' cy='300' r='120' fill='rgba(0,0,0,0.12)'/></svg>`;
  return `data:image/svg+xml,${svg.replace(/\n\s*/g, "")}`;
}

export const contacts: Record<string, Contact> = {
  aria: { id: "aria", name: "Aria Vale", handle: "@aria", hue: 268, presence: "online", bio: "Designing quiet interfaces.", status: "In the zone" },
  kite: { id: "kite", name: "Kite", handle: "@kite.exe", hue: 190, presence: "online", bio: "shipping in the dark", status: "🚀 nightly build" },
  nova: { id: "nova", name: "Nova Ito", handle: "@nova", hue: 322, presence: "away", bio: "photons & photographs", status: "chasing light" },
  rune: { id: "rune", name: "Rune", handle: "@rune", hue: 150, presence: "offline", bio: "afk — back soon", status: "away" },
  sable: { id: "sable", name: "Sable Cruz", handle: "@sable", hue: 28, presence: "online", bio: "sound designer", status: "making noise" },
  echo: { id: "echo", name: "Echo Lab", handle: "@echo", hue: 210, presence: "away", bio: "research collective", status: "" },
  lyra: { id: "lyra", name: "Lyra Sun", handle: "@lyra", hue: 46, presence: "online", bio: "type & motion", status: "kerning things" },
  vex: { id: "vex", name: "Vex", handle: "@vex", hue: 300, presence: "offline", bio: "security research", status: "" },
};

export const conversations: Conversation[] = [
  { id: "c-aria", contactId: "aria", pinned: true, unread: 0 },
  { id: "c-kite", contactId: "kite", pinned: true, unread: 2 },
  { id: "c-nova", contactId: "nova", unread: 0 },
  { id: "c-sable", contactId: "sable", unread: 5 },
  { id: "c-lyra", contactId: "lyra", unread: 0 },
  { id: "c-echo", contactId: "echo", muted: true, unread: 0 },
  { id: "c-rune", contactId: "rune", unread: 0 },
];

type Row = Partial<Message> & { authorId: string; agoMin: number };

function seed(conversationId: string, rows: Row[]): Message[] {
  return rows.map((r, i) => ({
    id: `${conversationId}-${i}`,
    conversationId,
    authorId: r.authorId,
    kind: r.kind ?? "text",
    text: r.text,
    attachment: r.attachment,
    voice: r.voice,
    ts: now - r.agoMin * min,
    status: r.authorId === ME ? "read" : undefined,
  }));
}

export const messages: Record<string, Message[]> = {
  "c-aria": seed("c-aria", [
    { authorId: "aria", text: "morning — did the aurora build land?", agoMin: 240 },
    { authorId: ME, text: "just pushed it. the background actually drifts now ✨", agoMin: 236 },
    { authorId: "aria", text: "oh that's gorgeous. it feels alive", agoMin: 235 },
    { authorId: "aria", text: "the way the panels catch the light is so good", agoMin: 234 },
    { authorId: ME, text: "wait till you see the send animation", agoMin: 232 },
    { authorId: "aria", text: "show me 👀", agoMin: 3 },
  ]),
  "c-kite": seed("c-kite", [
    { authorId: "kite", text: "yo the frameless window works on my machine", agoMin: 90 },
    { authorId: "kite", text: "drag region + custom controls, super clean", agoMin: 88 },
    { authorId: ME, text: "nice. minimize/close wired through the tauri api", agoMin: 60 },
    { authorId: "kite", kind: "file", agoMin: 40, attachment: { name: "nyx-nightly-0.1.0.zip", size: 48_210_944, mime: "application/zip" } },
    { authorId: "kite", text: "we should ship a nightly", agoMin: 2 },
    { authorId: "kite", text: "i can cut the build tonight", agoMin: 1 },
  ]),
  "c-nova": seed("c-nova", [
    { authorId: "nova", text: "sent you three frames for the splash", agoMin: 600 },
    { authorId: "nova", kind: "image", agoMin: 599, attachment: { name: "splash-violet.png", size: 1_204_000, mime: "image/png", url: photo(268, 322) } },
    { authorId: ME, text: "the violet one. no question", agoMin: 590 },
    { authorId: "nova", text: "knew you'd say that 😄", agoMin: 588 },
  ]),
  "c-sable": seed("c-sable", [
    { authorId: "sable", text: "made a little chime for message-sent", agoMin: 400 },
    { authorId: "sable", kind: "voice", agoMin: 399, voice: { duration: 6, peaks: makePeaks(48, 0.42) } },
    { authorId: "sable", text: "and a softer one for received", agoMin: 398 },
    { authorId: "sable", text: "ok i made too many sounds", agoMin: 397 },
    { authorId: "sable", text: "tell me which ones to keep", agoMin: 30 },
  ]),
  "c-lyra": seed("c-lyra", [
    { authorId: "lyra", text: "Space Grotesk for display was the right call", agoMin: 320 },
    { authorId: ME, text: "agreed. Inter for body reads so clean", agoMin: 318 },
  ]),
  "c-echo": seed("c-echo", [
    { authorId: "echo", text: "weekly sync notes are up", agoMin: 1440 },
    { authorId: "echo", kind: "file", agoMin: 1439, attachment: { name: "sync-notes-w28.pdf", size: 284_000, mime: "application/pdf" } },
    { authorId: ME, text: "thanks — reading now", agoMin: 1438 },
  ]),
  "c-rune": seed("c-rune", [
    { authorId: "rune", text: "afk for a bit, ping me later", agoMin: 2880 },
    { authorId: ME, text: "👍", agoMin: 2878 },
  ]),
};

export const callLog: CallLogEntry[] = [
  { id: "call-1", contactId: "aria", kind: "video", direction: "outgoing", ts: now - 30 * min, duration: 742 },
  { id: "call-2", contactId: "kite", kind: "voice", direction: "incoming", ts: now - 180 * min, duration: 96 },
  { id: "call-3", contactId: "nova", kind: "voice", direction: "missed", ts: now - 6 * 60 * min, duration: 0 },
  { id: "call-4", contactId: "sable", kind: "voice", direction: "outgoing", ts: now - 20 * 60 * min, duration: 318 },
  { id: "call-5", contactId: "lyra", kind: "video", direction: "incoming", ts: now - 28 * 60 * min, duration: 1290 },
  { id: "call-6", contactId: "aria", kind: "voice", direction: "outgoing", ts: now - 50 * 60 * min, duration: 54 },
];

/** Canned replies the demo peer cycles through so the app feels responsive. */
export const cannedReplies = [
  "oh that's slick",
  "wait, do that again",
  "the motion on that is unreal ✨",
  "shipping this. no notes.",
  "how did you get it that smooth?",
  "ok this is my new favorite app",
  "the glow follows the cursor?? incredible",
  "adding it to the nightly",
];
