import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ActiveCall, CallKind, CallLogEntry } from "../types";
import { callLog as seedLog } from "../data/mock";
import { uid } from "../lib/format";
import { supabase } from "../lib/supabase";

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

interface Signal {
  type: "offer" | "answer" | "ice" | "end" | "decline";
  from: string;
  kind?: CallKind;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

let pc: RTCPeerConnection | null = null;
let personalCh: RealtimeChannel | null = null;
let peerCh: RealtimeChannel | null = null;
let myId = "";
let currentPeer = "";
let pendingOffer: Signal | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let wasIncoming = false;

interface CallState {
  active: ActiveCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  log: CallLogEntry[];

  initSignaling: (userId: string) => void;
  teardownSignaling: () => void;
  start: (contactId: string, kind: CallKind) => Promise<void>;
  accept: () => Promise<void>;
  decline: () => void;
  end: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
}

export const useCallStore = create<CallState>((set, get) => {
  async function peerChannel(peerId: string): Promise<RealtimeChannel | null> {
    if (!supabase) return null;
    if (peerCh && currentPeer === peerId) return peerCh;
    if (peerCh) supabase.removeChannel(peerCh);
    currentPeer = peerId;
    const ch = supabase.channel(`rtc:${peerId}`);
    await new Promise<void>((res) => ch.subscribe((s) => s === "SUBSCRIBED" && res()));
    peerCh = ch;
    return ch;
  }

  async function signal(peerId: string, sig: Omit<Signal, "from">) {
    const ch = await peerChannel(peerId);
    ch?.send({ type: "broadcast", event: "signal", payload: { ...sig, from: myId } });
  }

  function newPc(peerId: string): RTCPeerConnection {
    const conn = new RTCPeerConnection(ICE);
    conn.onicecandidate = (e) => {
      if (e.candidate) signal(peerId, { type: "ice", candidate: e.candidate.toJSON() });
    };
    conn.ontrack = (e) => {
      set((s) => ({
        remoteStream: e.streams[0] ?? s.remoteStream,
        active: s.active
          ? { ...s.active, status: "active", startedAt: s.active.startedAt ?? Date.now() }
          : s.active,
      }));
    };
    return conn;
  }

  async function getMedia(kind: CallKind): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video",
      });
    } catch {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
  }

  function flushCandidates() {
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingCandidates) pc.addIceCandidate(c).catch(() => {});
    pendingCandidates = [];
  }

  function cleanup(logIt: boolean) {
    const a = get().active;
    if (logIt && a && a.startedAt) {
      const entry: CallLogEntry = {
        id: uid("call"),
        contactId: a.contactId,
        kind: a.kind,
        direction: wasIncoming ? "incoming" : "outgoing",
        ts: Date.now(),
        duration: (Date.now() - a.startedAt) / 1000,
      };
      set((s) => ({ log: [entry, ...s.log] }));
    } else if (logIt && a) {
      set((s) => ({
        log: [
          { id: uid("call"), contactId: a.contactId, kind: a.kind, direction: "missed", ts: Date.now(), duration: 0 },
          ...s.log,
        ],
      }));
    }
    get().localStream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    pc = null;
    if (peerCh && supabase) supabase.removeChannel(peerCh);
    peerCh = null;
    currentPeer = "";
    pendingOffer = null;
    pendingCandidates = [];
    set({ active: null, localStream: null, remoteStream: null });
  }

  async function handleSignal(sig: Signal) {
    switch (sig.type) {
      case "offer": {
        if (get().active) {
          signal(sig.from, { type: "decline" });
          return;
        }
        wasIncoming = true;
        pendingOffer = sig;
        set({
          active: {
            contactId: sig.from,
            kind: sig.kind ?? "voice",
            status: "incoming",
            muted: false,
            cameraOn: sig.kind === "video",
            speakerOn: true,
          },
        });
        break;
      }
      case "answer": {
        if (pc && sig.sdp) {
          await pc.setRemoteDescription(sig.sdp);
          flushCandidates();
        }
        break;
      }
      case "ice": {
        if (sig.candidate) {
          if (pc && pc.remoteDescription) pc.addIceCandidate(sig.candidate).catch(() => {});
          else pendingCandidates.push(sig.candidate);
        }
        break;
      }
      case "end":
      case "decline":
        cleanup(true);
        break;
    }
  }

  return {
    active: null,
    localStream: null,
    remoteStream: null,
    log: seedLog,

    initSignaling: (userId) => {
      if (!supabase) return;
      myId = userId;
      personalCh?.unsubscribe();
      personalCh = supabase
        .channel(`rtc:${userId}`)
        .on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload as Signal))
        .subscribe();
    },

    teardownSignaling: () => {
      cleanup(false);
      if (personalCh && supabase) supabase.removeChannel(personalCh);
      personalCh = null;
      myId = "";
    },

    start: async (contactId, kind) => {
      if (!supabase) return;
      wasIncoming = false;
      await peerChannel(contactId);
      const stream = await getMedia(kind);
      pc = newPc(contactId);
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      set({
        active: { contactId, kind, status: "outgoing", muted: false, cameraOn: kind === "video", speakerOn: true },
        localStream: stream,
        remoteStream: null,
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal(contactId, { type: "offer", kind, sdp: offer });
    },

    accept: async () => {
      const off = pendingOffer;
      if (!off || !supabase) return;
      const kind = off.kind ?? "voice";
      await peerChannel(off.from);
      const stream = await getMedia(kind);
      pc = newPc(off.from);
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      set((s) => ({
        localStream: stream,
        active: s.active ? { ...s.active, status: "connecting" } : s.active,
      }));
      if (off.sdp) await pc.setRemoteDescription(off.sdp);
      flushCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal(off.from, { type: "answer", sdp: answer });
      pendingOffer = null;
    },

    decline: () => {
      if (pendingOffer) signal(pendingOffer.from, { type: "decline" });
      cleanup(true);
    },

    end: () => {
      if (currentPeer) signal(currentPeer, { type: "end" });
      cleanup(true);
    },

    toggleMute: () =>
      set((s) => {
        if (!s.active || !s.localStream) return s;
        const muted = !s.active.muted;
        s.localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
        return { active: { ...s.active, muted } };
      }),

    toggleCamera: () =>
      set((s) => {
        if (!s.active || !s.localStream) return s;
        const cameraOn = !s.active.cameraOn;
        s.localStream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
        return { active: { ...s.active, cameraOn } };
      }),

    toggleSpeaker: () =>
      set((s) => (s.active ? { active: { ...s.active, speakerOn: !s.active.speakerOn } } : s)),
  };
});
