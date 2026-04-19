import { create } from "zustand";
import type { SignLabel } from "@auslan/vocab";

export type CallStatus =
  | "idle"
  | "creating"
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "ended";

export interface RemoteSubtitleEntry {
  id: string;
  label: SignLabel;
  displayText: string;
  confidence: number;
  timestampMs: number;
  sequenceId: number;
}

const MAX_REMOTE_SUBTITLES = 5;

interface CallState {
  roomId: string | null;
  status: CallStatus;
  remoteStream: MediaStream | null;
  remoteSubtitles: RemoteSubtitleEntry[];
  subtitlesAvailable: boolean;
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;

  setRoomId: (id: string | null) => void;
  setStatus: (s: CallStatus) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  addRemoteSubtitle: (entry: Omit<RemoteSubtitleEntry, "id">) => void;
  clearRemoteSubtitles: () => void;
  setSubtitlesAvailable: (v: boolean) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setDataChannel: (dc: RTCDataChannel | null) => void;
  reset: () => void;
}

let nextId = 0;

export const useCallStore = create<CallState>((set) => ({
  roomId: null,
  status: "idle",
  remoteStream: null,
  remoteSubtitles: [],
  subtitlesAvailable: true,
  peerConnection: null,
  dataChannel: null,

  setRoomId: (roomId) => set({ roomId }),
  setStatus: (status) => set({ status }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  addRemoteSubtitle: (entry) =>
    set((state) => ({
      remoteSubtitles: [
        ...state.remoteSubtitles.slice(-(MAX_REMOTE_SUBTITLES - 1)),
        { ...entry, id: String(nextId++) },
      ],
    })),
  clearRemoteSubtitles: () => set({ remoteSubtitles: [] }),
  setSubtitlesAvailable: (subtitlesAvailable) => set({ subtitlesAvailable }),
  setPeerConnection: (peerConnection) => set({ peerConnection }),
  setDataChannel: (dataChannel) => set({ dataChannel }),
  reset: () =>
    set({
      roomId: null,
      status: "idle",
      remoteStream: null,
      remoteSubtitles: [],
      subtitlesAvailable: true,
      peerConnection: null,
      dataChannel: null,
    }),
}));
