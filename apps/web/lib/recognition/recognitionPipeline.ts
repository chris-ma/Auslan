import * as tf from "@tensorflow/tfjs";
import { buildFeatureVector } from "./normalizer";
import { FrameBuffer } from "./frameBuffer";
import {
  loadSignClassifier,
  classify,
  type ClassifierResult,
} from "./signClassifier";
import { loadRestPoseDetector, isSigning } from "./restPoseDetector";
import { ruleBasedGesture } from "./gestureRules";
import { loadStageModel } from "../training/stageModels";
import { SIGN_MAP } from "@auslan/vocab";
import type { SignLabel } from "@auslan/vocab";
import type { LandmarkerResult } from "../mediapipe/types";

const WINDOW_SIZE = 30;
const FEATURES_PER_FRAME = 126; // 63 × 2 hands
const MIN_SIGN_GAP_MS = 250;
const NO_HAND_GRACE_FRAMES = 4;

const RULE_HISTORY_SIZE = 8;
const RULE_MIN_CONSISTENT = 6;

export interface PipelineResult extends ClassifierResult {
  timestampMs: number;
}

function classifyWithStageModel(
  model: tf.LayersModel,
  data: Float32Array,
  labels: string[],
  inputShape: number[],
  threshold: number
): PipelineResult | null {
  const input = tf.tensor(data, [1, ...inputShape]).toFloat();
  const output = model.predict(input) as tf.Tensor;
  const probs = output.dataSync() as Float32Array;
  output.dispose();
  input.dispose();

  let maxIdx = 0;
  let maxProb = 0;
  for (let i = 0; i < probs.length; i++) {
    const p = probs[i] ?? 0;
    if (p > maxProb) { maxProb = p; maxIdx = i; }
  }

  if (maxProb < threshold) return null;
  const labelStr = labels[maxIdx];
  if (!labelStr) return null;

  const def = SIGN_MAP.get(labelStr as SignLabel);
  return {
    label: labelStr as SignLabel,
    displayText: def?.displayText ?? labelStr.replace(/-/g, " "),
    confidence: maxProb,
    timestampMs: 0,
  };
}

export class RecognitionPipeline {
  private buffer = new FrameBuffer(WINDOW_SIZE, FEATURES_PER_FRAME);
  private buf15 = new FrameBuffer(15, FEATURES_PER_FRAME);
  private buf45 = new FrameBuffer(45, FEATURES_PER_FRAME);

  private lastEmittedLabel: string | null = null;
  private lastEmittedAt = 0;
  private running = false;
  private noHandCount = 0;
  private ruleHistory: (SignLabel | null)[] = [];

  private stage1Model: tf.LayersModel | null = null;
  private stage2Model: tf.LayersModel | null = null;
  private stage3Model: tf.LayersModel | null = null;
  private stage1Labels: string[] = [];
  private stage2Labels: string[] = [];
  private stage3Labels: string[] = [];

  confidenceThreshold = 0.05;

  async init(): Promise<void> {
    await Promise.all([
      loadSignClassifier(),
      loadRestPoseDetector(),
      this.loadTrainedModels(),
    ]);
  }

  async loadTrainedModels(): Promise<void> {
    const [s1, s2, s3] = await Promise.all([
      loadStageModel(1),
      loadStageModel(2),
      loadStageModel(3),
    ]);
    if (s1) { this.stage1Model = s1.model; this.stage1Labels = s1.labels; }
    if (s2) { this.stage2Model = s2.model; this.stage2Labels = s2.labels; }
    if (s3) { this.stage3Model = s3.model; this.stage3Labels = s3.labels; }
  }

  /** Call after a stage finishes training to hot-reload its model. */
  async reloadTrainedModels(): Promise<void> {
    await this.loadTrainedModels();
  }

  start(): void {
    this.running = true;
    this.buffer.reset();
    this.buf15.reset();
    this.buf45.reset();
    this.ruleHistory = [];
    this.lastEmittedLabel = null;
    this.lastEmittedAt = 0;
    this.noHandCount = 0;
  }

  stop(): void {
    this.running = false;
    this.buffer.reset();
    this.buf15.reset();
    this.buf45.reset();
    this.ruleHistory = [];
    this.noHandCount = 0;
  }

  private tryEmit(
    result: Omit<PipelineResult, "timestampMs">,
    timestampMs: number
  ): PipelineResult | null {
    const sameAsLast = result.label === this.lastEmittedLabel;
    const tooSoon = timestampMs - this.lastEmittedAt < MIN_SIGN_GAP_MS;
    if (sameAsLast && tooSoon) return null;
    this.lastEmittedLabel = result.label;
    this.lastEmittedAt = timestampMs;
    return { ...result, timestampMs };
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
        this.buf15.reset();
        this.buf45.reset();
        this.ruleHistory = [];
      }
      return null;
    }

    this.noHandCount = 0;

    // ── Rule-based path ──────────────────────────────────────────────────
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
        this.ruleHistory = [];
        const def = SIGN_MAP.get(bestLabel);
        const r = this.tryEmit(
          { label: bestLabel, displayText: def?.displayText ?? bestLabel, confidence: bestCount / RULE_HISTORY_SIZE },
          timestampMs
        );
        if (r) return r;
      }
    }

    // ── Build feature vector for ML paths ───────────────────────────────
    const frame = buildFeatureVector(hands);

    // ── Stage 1: single-frame trained model ──────────────────────────────
    if (this.stage1Model && this.stage1Labels.length > 0) {
      const s1 = classifyWithStageModel(
        this.stage1Model, frame, this.stage1Labels,
        [FEATURES_PER_FRAME], this.confidenceThreshold
      );
      if (s1) {
        const r = this.tryEmit(s1, timestampMs);
        if (r) return r;
      }
    }

    // ── Feed sequential buffers ──────────────────────────────────────────
    this.buf15.push(frame);
    this.buf45.push(frame);

    // ── Stage 2: 15-frame trained model ──────────────────────────────────
    if (this.stage2Model && this.stage2Labels.length > 0 && this.buf15.isFull) {
      const s2 = classifyWithStageModel(
        this.stage2Model, this.buf15.snapshot(), this.stage2Labels,
        [15, FEATURES_PER_FRAME], this.confidenceThreshold
      );
      if (s2) {
        const r = this.tryEmit(s2, timestampMs);
        if (r) return r;
      }
    }

    // ── Stage 3: 45-frame trained model ──────────────────────────────────
    if (this.stage3Model && this.stage3Labels.length > 0 && this.buf45.isFull) {
      const s3 = classifyWithStageModel(
        this.stage3Model, this.buf45.snapshot(), this.stage3Labels,
        [45, FEATURES_PER_FRAME], this.confidenceThreshold
      );
      if (s3) {
        const r = this.tryEmit(s3, timestampMs);
        if (r) return r;
      }
    }

    // ── Fallback: REST gate + 30-frame static classifier ─────────────────
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
    return this.tryEmit(result, timestampMs);
  }
}
