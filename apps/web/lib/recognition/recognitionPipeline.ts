import { buildFeatureVector } from "./normalizer";
import { FrameBuffer } from "./frameBuffer";
import {
  loadSignClassifier,
  classify,
  type ClassifierResult,
} from "./signClassifier";
import { loadRestPoseDetector, isSigning } from "./restPoseDetector";
import type { LandmarkerResult } from "../mediapipe/types";

const WINDOW_SIZE = 30;
const FEATURES_PER_FRAME = 126; // 63 × 2 hands
const MIN_SIGN_GAP_MS = 250;
// Frames of missing hands allowed before resetting the buffer.
// Prevents a single dropped detection from wiping accumulated frames.
const NO_HAND_GRACE_FRAMES = 4;

export interface PipelineResult extends ClassifierResult {
  timestampMs: number;
}

export class RecognitionPipeline {
  private buffer = new FrameBuffer(WINDOW_SIZE, FEATURES_PER_FRAME);
  private lastEmittedLabel: string | null = null;
  private lastEmittedAt = 0;
  private running = false;
  private noHandCount = 0;

  /** Live threshold — update this from the recognition store to take effect immediately. */
  confidenceThreshold = 0.05;

  async init(): Promise<void> {
    await Promise.all([loadSignClassifier(), loadRestPoseDetector()]);
  }

  start(): void {
    this.running = true;
    this.buffer.reset();
    this.lastEmittedLabel = null;
    this.lastEmittedAt = 0;
    this.noHandCount = 0;
  }

  stop(): void {
    this.running = false;
    this.buffer.reset();
    this.noHandCount = 0;
  }

  async processFrame(
    landmarkerResult: LandmarkerResult
  ): Promise<PipelineResult | null> {
    if (!this.running) return null;

    const { hands, timestampMs } = landmarkerResult;

    if (hands.length === 0) {
      this.noHandCount++;
      if (this.noHandCount >= NO_HAND_GRACE_FRAMES) this.buffer.reset();
      return null;
    }

    this.noHandCount = 0;

    const frame = buildFeatureVector(hands);

    const signing = await isSigning(frame);
    if (!signing) {
      this.buffer.reset();
      return null;
    }

    this.buffer.push(frame);

    if (!this.buffer.isFull) return null;

    const result = await classify(
      this.buffer.snapshot(),
      WINDOW_SIZE,
      FEATURES_PER_FRAME,
      this.confidenceThreshold
    );

    if (!result) return null;

    const now = timestampMs;
    const sameAsLast = result.label === this.lastEmittedLabel;
    const tooSoon = now - this.lastEmittedAt < MIN_SIGN_GAP_MS;

    if (sameAsLast && tooSoon) return null;

    this.lastEmittedLabel = result.label;
    this.lastEmittedAt = now;

    return { ...result, timestampMs };
  }
}
