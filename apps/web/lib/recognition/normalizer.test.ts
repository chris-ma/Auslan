import { describe, it, expect } from "vitest";
import { normalizeLandmarks, buildFeatureVector, FEATURES_PER_HAND } from "./normalizer";
import type { Landmark } from "../mediapipe/types";

function makeLandmarks(offset = 0): Landmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: i * 0.05 + offset,
    y: i * 0.03 + offset,
    z: i * 0.01,
  }));
}

describe("normalizeLandmarks", () => {
  it("returns a Float32Array of length 63", () => {
    const lms = makeLandmarks();
    const out = normalizeLandmarks(lms);
    expect(out).toBeInstanceOf(Float32Array);
    expect(out.length).toBe(FEATURES_PER_HAND);
  });

  it("wrist (index 0) is always at origin after normalisation", () => {
    const lms = makeLandmarks(5); // offset so wrist is not at 0
    const out = normalizeLandmarks(lms);
    expect(out[0]).toBeCloseTo(0, 6); // x
    expect(out[1]).toBeCloseTo(0, 6); // y
    expect(out[2]).toBeCloseTo(0, 6); // z
  });

  it("is scale-invariant: scaling all landmarks does not change output", () => {
    const lms = makeLandmarks();
    const scaled = lms.map((lm) => ({ x: lm.x * 2, y: lm.y * 2, z: lm.z * 2 }));

    const a = normalizeLandmarks(lms);
    const b = normalizeLandmarks(scaled);

    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toBeCloseTo(b[i]!, 5);
    }
  });

  it("returns all zeros for empty / wrong-length landmarks", () => {
    const out = normalizeLandmarks([]);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it("handles degenerate case where all points are at origin (scale ≈ 0)", () => {
    const lms = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    const out = normalizeLandmarks(lms);
    // Should not throw or produce NaN
    expect(Array.from(out).some(Number.isNaN)).toBe(false);
  });
});

describe("buildFeatureVector", () => {
  it("returns a Float32Array of length 126 (2 × 63)", () => {
    const out = buildFeatureVector([]);
    expect(out).toBeInstanceOf(Float32Array);
    expect(out.length).toBe(FEATURES_PER_HAND * 2);
  });

  it("places right hand in slots 0–62 and left in 63–125", () => {
    const rightLms = makeLandmarks(0);
    const leftLms = makeLandmarks(1);

    const out = buildFeatureVector([
      { landmarks: rightLms, handedness: "Right" },
      { landmarks: leftLms, handedness: "Left" },
    ]);

    const rightNorm = normalizeLandmarks(rightLms);
    const leftNorm = normalizeLandmarks(leftLms);

    // Right hand occupies [0, 63)
    for (let i = 0; i < 63; i++) {
      expect(out[i]).toBeCloseTo(rightNorm[i]!, 5);
    }
    // Left hand occupies [63, 126)
    for (let i = 0; i < 63; i++) {
      expect(out[63 + i]).toBeCloseTo(leftNorm[i]!, 5);
    }
  });

  it("zero-pads the non-dominant slot when only one hand present", () => {
    const rightLms = makeLandmarks();
    const out = buildFeatureVector([{ landmarks: rightLms, handedness: "Right" }]);

    // Left hand region should be all zeros
    const leftSlice = Array.from(out.slice(63, 126));
    expect(leftSlice.every((v) => v === 0)).toBe(true);
  });
});
