import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { SignLabel } from "@auslan/vocab";

export type RecognitionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "active"
  | "error";

export type SubtitleFontSize = "sm" | "md" | "lg";
export type SubtitlePosition = "bottom" | "top";

export interface SubtitleEntry {
  id: string;
  label: SignLabel;
  displayText: string;
  confidence: number;
  timestampMs: number;
}

const MAX_SUBTITLE_HISTORY = 5;

interface RecognitionState {
  status: RecognitionStatus;
  errorMessage: string | null;
  subtitles: SubtitleEntry[];
  fps: number;
  showConfidence: boolean;
  confidenceThreshold: number;
  fontSize: SubtitleFontSize;
  subtitlePosition: SubtitlePosition;
  subtitleOpacity: number;

  setStatus: (s: RecognitionStatus) => void;
  setError: (msg: string | null) => void;
  addSubtitle: (entry: Omit<SubtitleEntry, "id">) => void;
  clearSubtitles: () => void;
  setFps: (fps: number) => void;
  setShowConfidence: (v: boolean) => void;
  setConfidenceThreshold: (v: number) => void;
  setFontSize: (v: SubtitleFontSize) => void;
  setSubtitlePosition: (v: SubtitlePosition) => void;
  setSubtitleOpacity: (v: number) => void;
}

let nextId = 0;

export const useRecognitionStore = create<RecognitionState>()(
  subscribeWithSelector((set) => ({
  status: "idle",
  errorMessage: null,
  subtitles: [],
  fps: 0,
  showConfidence: false,
  confidenceThreshold: 0.3,
  fontSize: "md",
  subtitlePosition: "bottom",
  subtitleOpacity: 0.85,

  setStatus: (status) => set({ status }),
  setError: (errorMessage) => set({ errorMessage }),
  addSubtitle: (entry) =>
    set((state) => ({
      subtitles: [
        ...state.subtitles.slice(-(MAX_SUBTITLE_HISTORY - 1)),
        { ...entry, id: String(nextId++) },
      ],
    })),
  clearSubtitles: () => set({ subtitles: [] }),
  setFps: (fps) => set({ fps }),
  setShowConfidence: (showConfidence) => set({ showConfidence }),
  setConfidenceThreshold: (confidenceThreshold) =>
    set({ confidenceThreshold }),
  setFontSize: (fontSize) => set({ fontSize }),
  setSubtitlePosition: (subtitlePosition) => set({ subtitlePosition }),
  setSubtitleOpacity: (subtitleOpacity) => set({ subtitleOpacity }),
})));
