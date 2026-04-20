import { describe, it, expect, beforeEach } from "vitest";
import { FrameBuffer } from "./frameBuffer";

const WINDOW = 4;
const FEATURES = 6;

function makeFrame(fill: number): Float32Array {
  return new Float32Array(FEATURES).fill(fill);
}

describe("FrameBuffer", () => {
  let buf: FrameBuffer;

  beforeEach(() => {
    buf = new FrameBuffer(WINDOW, FEATURES);
  });

  it("starts with hasData=false and isFull=false", () => {
    expect(buf.hasData).toBe(false);
    expect(buf.isFull).toBe(false);
  });

  it("hasData becomes true after first push", () => {
    buf.push(makeFrame(1));
    expect(buf.hasData).toBe(true);
    expect(buf.isFull).toBe(false);
  });

  it("isFull only after windowSize pushes", () => {
    for (let i = 0; i < WINDOW - 1; i++) buf.push(makeFrame(i));
    expect(buf.isFull).toBe(false);
    buf.push(makeFrame(99));
    expect(buf.isFull).toBe(true);
  });

  it("snapshot returns frames in chronological order", () => {
    for (let i = 0; i < WINDOW; i++) buf.push(makeFrame(i));

    const snap = buf.snapshot();
    expect(snap.length).toBe(WINDOW * FEATURES);

    for (let i = 0; i < WINDOW; i++) {
      const frameSlice = snap.slice(i * FEATURES, (i + 1) * FEATURES);
      expect(Array.from(frameSlice).every((v) => v === i)).toBe(true);
    }
  });

  it("overwrites oldest frames when full (circular behaviour)", () => {
    // Fill the buffer with frames 0..3
    for (let i = 0; i < WINDOW; i++) buf.push(makeFrame(i));
    // Push one more — frame 0 should be evicted, frames 1..4 remain
    buf.push(makeFrame(99));

    const snap = buf.snapshot();
    // Chronological: [1, 2, 3, 99]
    const expected = [1, 2, 3, 99];
    for (let i = 0; i < WINDOW; i++) {
      const frameSlice = snap.slice(i * FEATURES, (i + 1) * FEATURES);
      expect(Array.from(frameSlice).every((v) => v === expected[i])).toBe(true);
    }
  });

  it("reset clears all state", () => {
    for (let i = 0; i < WINDOW; i++) buf.push(makeFrame(i));
    expect(buf.isFull).toBe(true);

    buf.reset();
    expect(buf.hasData).toBe(false);
    expect(buf.isFull).toBe(false);
    const snap = buf.snapshot();
    expect(Array.from(snap).every((v) => v === 0)).toBe(true);
  });

  it("throws on wrong-length frame", () => {
    expect(() => buf.push(new Float32Array(FEATURES + 1))).toThrow();
  });
});
