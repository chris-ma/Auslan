import type { Landmark } from "../mediapipe/types";

const WRIST_IDX = 0;
const MCP_MIDDLE_IDX = 9;
const FEATURES_PER_HAND = 63; // 21 landmarks × 3 coords

/**
 * Normalises a 21-landmark hand so that:
 *   - wrist is at origin
 *   - scale is invariant (divided by wrist-to-middle-MCP distance)
 * Returns a flat Float32Array of length 63.
 */
export function normalizeLandmarks(landmarks: Landmark[]): Float32Array {
  if (landmarks.length !== 21) {
    return new Float32Array(FEATURES_PER_HAND);
  }

  const wrist = landmarks[WRIST_IDX]!;
  const mcpMiddle = landmarks[MCP_MIDDLE_IDX]!;

  const scale = Math.sqrt(
    (mcpMiddle.x - wrist.x) ** 2 +
      (mcpMiddle.y - wrist.y) ** 2 +
      (mcpMiddle.z - wrist.z) ** 2
  );

  const safeScale = scale < 1e-6 ? 1 : scale;
  const out = new Float32Array(FEATURES_PER_HAND);

  for (let i = 0; i < 21; i++) {
    const lm = landmarks[i]!;
    out[i * 3 + 0] = (lm.x - wrist.x) / safeScale;
    out[i * 3 + 1] = (lm.y - wrist.y) / safeScale;
    out[i * 3 + 2] = (lm.z - wrist.z) / safeScale;
  }

  return out;
}

/**
 * Builds a combined feature vector for up to two hands.
 * Dominant (right) hand occupies slots 0-62; non-dominant slots 63-125.
 * Zero-pads when fewer hands are present.
 */
export function buildFeatureVector(
  hands: { landmarks: Landmark[]; handedness: "Left" | "Right" }[]
): Float32Array {
  const out = new Float32Array(FEATURES_PER_HAND * 2);

  for (const hand of hands) {
    const normalized = normalizeLandmarks(hand.landmarks);
    const offset = hand.handedness === "Right" ? 0 : FEATURES_PER_HAND;
    out.set(normalized, offset);
  }

  return out;
}

export { FEATURES_PER_HAND };
