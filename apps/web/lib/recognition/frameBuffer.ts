import { FEATURES_PER_HAND } from "./normalizer";

const WINDOW_FRAMES = 30;
const FEATURES_PER_FRAME = FEATURES_PER_HAND * 2; // both hands

/**
 * Fixed-capacity circular buffer of landmark feature vectors.
 * When full, oldest frames are overwritten.
 */
export class FrameBuffer {
  private readonly buf: Float32Array;
  private head = 0;
  private count = 0;

  readonly windowSize: number;
  readonly featuresPerFrame: number;

  constructor(
    windowSize = WINDOW_FRAMES,
    featuresPerFrame = FEATURES_PER_FRAME
  ) {
    this.windowSize = windowSize;
    this.featuresPerFrame = featuresPerFrame;
    this.buf = new Float32Array(windowSize * featuresPerFrame);
  }

  push(frame: Float32Array): void {
    if (frame.length !== this.featuresPerFrame) {
      throw new Error(
        `Expected frame of length ${this.featuresPerFrame}, got ${frame.length}`
      );
    }
    this.buf.set(frame, this.head * this.featuresPerFrame);
    this.head = (this.head + 1) % this.windowSize;
    if (this.count < this.windowSize) this.count++;
  }

  /** Returns frames in chronological order as a flat Float32Array. */
  snapshot(): Float32Array {
    const out = new Float32Array(this.windowSize * this.featuresPerFrame);
    for (let i = 0; i < this.windowSize; i++) {
      const srcIdx =
        ((this.head - this.windowSize + i + this.windowSize) %
          this.windowSize) *
        this.featuresPerFrame;
      const dstIdx = i * this.featuresPerFrame;
      out.set(this.buf.subarray(srcIdx, srcIdx + this.featuresPerFrame), dstIdx);
    }
    return out;
  }

  /** True once at least one frame has been pushed. */
  get hasData(): boolean {
    return this.count > 0;
  }

  /** True once the buffer has collected a full window. */
  get isFull(): boolean {
    return this.count >= this.windowSize;
  }

  reset(): void {
    this.buf.fill(0);
    this.head = 0;
    this.count = 0;
  }
}
