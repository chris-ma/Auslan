/// <reference lib="webworker" />
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { LandmarkerResult, Landmark, HandLandmarks } from "../mediapipe/types";

const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let landmarker: HandLandmarker | null = null;
let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

function parseResult(raw: HandLandmarkerResult, ts: number): LandmarkerResult {
  const hands: HandLandmarks[] = raw.landmarks.map((lms, i) => ({
    landmarks: lms as Landmark[],
    worldLandmarks: (raw.worldLandmarks[i] ?? []) as Landmark[],
    handedness:
      (raw.handedness[i]?.[0]?.categoryName as "Left" | "Right") ?? "Right",
  }));
  return { hands, timestampMs: ts };
}

self.onmessage = async (
  e: MessageEvent<{
    type: "init" | "frame" | "destroy";
    canvas?: OffscreenCanvas;
    bitmap?: ImageBitmap;
    timestampMs?: number;
  }>
) => {
  const { type } = e.data;

  if (type === "init") {
    const canvas = e.data.canvas;
    if (!canvas) return;
    offscreen = canvas;
    ctx = offscreen.getContext("2d");

    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  if (type === "frame" && landmarker && ctx && offscreen) {
    const { bitmap, timestampMs } = e.data;
    if (!bitmap || timestampMs === undefined) return;

    offscreen.width = bitmap.width;
    offscreen.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // OffscreenCanvas is a valid ImageSource at runtime but the TS types for
    // @mediapipe/tasks-vision don't yet include it — cast to suppress the error.
    const raw = landmarker.detectForVideo(
      offscreen as unknown as HTMLCanvasElement,
      timestampMs
    );
    const result = parseResult(raw, timestampMs);
    self.postMessage({ type: "result", payload: result });
    return;
  }

  if (type === "destroy") {
    landmarker?.close();
    landmarker = null;
    self.postMessage({ type: "destroyed" });
  }
};
