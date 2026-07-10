import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ActiveCall, CallKind, CallLogEntry } from "../types";
import { callLog as seedLog } from "../data/mock";
import { uid } from "../lib/format";
import { supabase } from "../lib/supabase";
import { useUIStore } from "./useUIStore";
import { alertHaptic } from "../lib/haptics";
import { fetchCalls, insertCall, subscribeCalls, toCall } from "../lib/chatApi";

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
let callsCh: RealtimeChannel | null = null;
let myId = "";
let currentPeer = "";
let pendingOffer: Signal | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let wasIncoming = false;
let noAnswerTimer: ReturnType<typeof setTimeout> | null = null;

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

function mediaError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError") return "Camera / microphone permission is blocked.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No microphone or camera was found on this device.";
  if (name === "NotReadableError") return "Your camera or mic is already in use by another app.";
  return "Couldn't access your microphone or camera.";
}

export const useCallStore = create<CallState>((set, get) => {
  const toast = (m: string) => useUIStore.getState().showToast(m);

  function addCall(entry: CallLogEntry) {
    set((s) => (s.log.some((c) => c.id === entry.id) ? s : { log: [entry, ...s.log] }));
  }

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

  function clearNoAnswer() {
    if (noAnswerTimer) clearTimeout(noAnswerTimer);
    noAnswerTimer = null;
  }

  function newPc(peerId: string): RTCPeerConnection {
    const conn = new RTCPeerConnection(ICE);
    conn.onicecandidate = (e) => {
      if (e.candidate) signal(peerId, { type: "ice", candidate: e.candidate.toJSON() });
    };
    conn.ontrack = (e) => {
      clearNoAnswer();
      set((s) => ({
        remoteStream: e.streams[0] ?? s.remoteStream,
        active: s.active
          ? { ...s.active, status: "active", startedAt: s.active.startedAt ?? Date.now() }
          : s.active,
      }));
    };
    conn.onconnectionstatechange = () => {
      if (conn.connectionState === "failed") {
        toast("Call couldn't connect on this network.");
        get().end();
      }
    };
    return conn;
  }

  /** Pick real, working audio/video. Verifies a mic actually produced a track. */
  async function getMedia(kind: CallKind): Promise<MediaStream> {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
      if (s.getAudioTracks().length === 0) throw new DOMException("no audio", "NotFoundError");
      return s;
    } catch (e) {
      if (kind === "video") {
        // Camera might be busy — fall back to a voice-only stream.
        return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      throw e;
    }
  }

  function flushCandidates() {
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingCandidates) pc.addIceCandidate(c).catch(() => {});
    pendingCandidates = [];
  }

  function cleanup(declined: boolean, log = true) {
    clearNoAnswer();
    const a = get().active;
    // Only the caller writes the shared call record (avoids duplicates).
    if (log && a && !wasIncoming) {
      const status = a.startedAt ? "completed" : declined ? "declined" : "missed";
      const duration = a.startedAt ? (Date.now() - a.startedAt) / 1000 : 0;
      if (supabase && myId) {
        insertCall(myId, a.contactId, a.kind, status, duration)
          .then((e) => e && addCall(e))
          .catch(() => {});
      } else {
        addCall({
          id: uid("call"),
          contactId: a.contactId,
          kind: a.kind,
          direction: status === "completed" ? "outgoing" : "missed",
          status,
          ts: Date.now(),
          duration,
        });
      }
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
        alertHaptic();
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
      case "decline":
        toast("Call declined");
        cleanup(true);
        break;
      case "end":
        cleanup(false);
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

      // Persistent call history.
      fetchCalls(userId).then((log) => set({ log })).catch(() => {});
      callsCh?.unsubscribe();
      callsCh = subscribeCalls((row) => addCall(toCall(row as Parameters<typeof toCall>[0], userId)));
    },

    teardownSignaling: () => {
      cleanup(false);
      if (supabase) {
        if (personalCh) supabase.removeChannel(personalCh);
        if (callsCh) supabase.removeChannel(callsCh);
      }
      personalCh = callsCh = null;
      myId = "";
      set({ log: seedLog });
    },

    start: async (contactId, kind) => {
      if (!supabase) return;
      if (get().active) return;
      wasIncoming = false;
      set({
        active: { contactId, kind, status: "outgoing", muted: false, cameraOn: kind === "video", speakerOn: true },
        localStream: null,
        remoteStream: null,
      });
      let stream: MediaStream;
      try {
        stream = await getMedia(kind);
      } catch (e) {
        toast(mediaError(e));
        cleanup(false, false);
        return;
      }
      await peerChannel(contactId);
      pc = newPc(contactId);
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      set({ localStream: stream });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal(contactId, { type: "offer", kind, sdp: offer });

      clearNoAnswer();
      noAnswerTimer = setTimeout(() => {
        if (get().active && get().active!.status !== "active") {
          toast("No answer");
          get().end();
        }
      }, 35000);
    },

    accept: async () => {
      const off = pendingOffer;
      if (!off || !supabase) return;
      const kind = off.kind ?? "voice";
      let stream: MediaStream;
      try {
        stream = await getMedia(kind);
      } catch (e) {
        toast(mediaError(e));
        get().decline();
        return;
      }
      await peerChannel(off.from);
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
      cleanup(false);
    },

    end: () => {
      if (currentPeer) signal(currentPeer, { type: "end" });
      cleanup(false);
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
