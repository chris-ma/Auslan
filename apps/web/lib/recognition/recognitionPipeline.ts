import { buildFeatureVector } from "./normalizer";
import { FrameBuffer } from "./frameBuffer";
import {
  loadSignClassifier,
  classify,
  type ClassifierResult,
} from "./signClassifier";
import { loadRestPoseDetector, isSigning } from "./restPoseDetector";
import { ruleBasedGesture } from "./gestureRules";
import { SIGN_MAP } from "@auslan/vocab";
import type { SignLabel } from "@auslan/vocab";
import type { LandmarkerResult } from "../mediapipe/types";

const WINDOW_SIZE = 30;
const FEATURES_PER_FRAME = 126; // 63 × 2 hands
const MIN_SIGN_GAP_MS = 250;
// Frames of missing hands allowed before resetting the buffer.
const NO_HAND_GRACE_FRAMES = 4;

// Rule-based detector: require this many consistent frames before emitting.
// At 60fps this is ~133ms — fast enough to feel immediate.
const RULE_HISTORY_SIZE = 8;
const RULE_MIN_CONSISTENT = 6; // 6 out of 8 frames

export interface PipelineResult extends ClassifierResult {
  timestampMs: number;
}

export class RecognitionPipeline {
  private buffer = new FrameBuffer(WINDOW_SIZE, FEATURES_PER_FRAME);
  private lastEmittedLabel: string | null = null;
  private lastEmittedAt = 0;
  private running = false;
  private noHandCount = 0;

  // Rule-based path state
  private ruleHistory: (SignLabel | null)[] = [];

  /** Live threshold — update this from the recognition store to take effect immediately. */
  confidenceThreshold = 0.05;

  async init(): Promise<void> {
    await Promise.all([loadSignClassifier(), loadRestPoseDetector()]);
  }

  start(): void {
    this.running = true;
    this.buffer.reset();
    this.ruleHistory = [];
    this.lastEmittedLabel = null;
    this.lastEmittedAt = 0;
    this.noHandCount = 0;
  }

  stop(): void {
    this.running = false;
    this.buffer.reset();
    this.ruleHistory = [];
    this.noHandCount = 0;
  }

  async processFrame(
    landmarkerResult: LandmarkerResult
  ): Promise<PipelineResult | null> {
    if (!this.running) return null;

    const { hands, timestampMs } = landmarkerResult;

    if (hands.length === 0) {
      this.noHandCount++;
      if (this.noHandCount >= NO_HAND_GRACE_FRAMES) {
        this.buffer.reset();
        this.ruleHistory = [];
      }
      return null;
    }

    this.noHandCount = 0;

    // ── Rule-based path (no training needed) ────────────────────────────
    const ruleGesture = ruleBasedGesture(hands);
    this.ruleHistory.push(ruleGesture);
    if (this.ruleHistory.length > RULE_HISTORY_SIZE) this.ruleHistory.shift();

    if (this.ruleHistory.length >= RULE_HISTORY_SIZE) {
      const counts = new Map<SignLabel, number>();
      for (const g of this.ruleHistory) {
        if (g !== null) counts.set(g, (counts.get(g) ?? 0) + 1);
      }
      let bestLabel: SignLabel | null = null;
      let bestCount = 0;
      for (const [label, count] of counts) {
        if (count > bestCount) { bestCount = count; bestLabel = label; }
      }

      if (bestLabel !== null && bestCount >= RULE_MIN_CONSISTENT) {
        const sameAsLast = bestLabel === this.lastEmittedLabel;
        const tooSoon = timestampMs - this.lastEmittedAt < MIN_SIGN_GAP_MS;
        if (!sameAsLast || !tooSoon) {
          this.lastEmittedLabel = bestLabel;
          this.lastEmittedAt = timestampMs;
          this.ruleHistory = []; // reset so next gesture starts fresh
          const def = SIGN_MAP.get(bestLabel);
          return {
            label: bestLabel,
            displayText: def?.displayText ?? bestLabel,
            confidence: bestCount / RULE_HISTORY_SIZE,
            timestampMs,
          };
        }
      }
    }

    // ── ML classifier path (needs trained models) ────────────────────────
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

    const sameAsLast = result.label === this.lastEmittedLabel;
    const tooSoon = timestampMs - this.lastEmittedAt < MIN_SIGN_GAP_MS;
    if (sameAsLast && tooSoon) return null;

    this.lastEmittedLabel = result.label;
    this.lastEmittedAt = timestampMs;

    return { ...result, timestampMs };
  }
}
