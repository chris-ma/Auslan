import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { LandmarkerResult, Landmark, HandLandmarks } from "./types";

const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let instance: HandLandmarker | null = null;
let initPromise: Promise<HandLandmarker> | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    instance = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
    return instance;
  })();

  return initPromise;
}

export function parseResult(
  raw: HandLandmarkerResult,
  timestampMs: number
): LandmarkerResult {
  const hands: HandLandmarks[] = raw.landmarks.map((lms, i) => ({
    landmarks: lms as Landmark[],
    worldLandmarks: (raw.worldLandmarks[i] ?? []) as Landmark[],
    handedness:
      (raw.handedness[i]?.[0]?.categoryName as "Left" | "Right") ?? "Right",
  }));

  return { hands, timestampMs };
}

export function destroyHandLandmarker(): void {
  instance?.close();
  instance = null;
  initPromise = null;
}
