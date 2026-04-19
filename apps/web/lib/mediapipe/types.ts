export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmarks {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  handedness: "Left" | "Right";
}

export interface LandmarkerResult {
  hands: HandLandmarks[];
  timestampMs: number;
}

export interface LandmarkerWorkerMessage {
  type: "result";
  payload: LandmarkerResult;
}

export interface LandmarkerWorkerCommand {
  type: "init" | "process" | "destroy";
  payload?: {
    wasmPath?: string;
    modelAssetPath?: string;
    numHands?: number;
    minHandDetectionConfidence?: number;
    minHandPresenceConfidence?: number;
    minTrackingConfidence?: number;
  };
}
