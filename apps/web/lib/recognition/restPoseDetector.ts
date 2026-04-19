import * as tf from "@tensorflow/tfjs";
import { FEATURES_PER_HAND } from "./normalizer";

const MODEL_PATH = "/models/rest-pose/model.json";
const REST_THRESHOLD = 0.6;

let model: tf.LayersModel | null = null;
let loadPromise: Promise<tf.LayersModel> | null = null;

export async function loadRestPoseDetector(): Promise<tf.LayersModel> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    model = await tf.loadLayersModel(MODEL_PATH);
    return model;
  })();

  return loadPromise;
}

/**
 * Returns true when the current frame looks like an active signing pose.
 * Falls back to true (assume signing) if the model isn't loaded.
 */
export async function isSigning(
  frame: Float32Array,
  threshold = REST_THRESHOLD
): Promise<boolean> {
  if (!model) return true;
  if (frame.every((v) => v === 0)) return false;

  return tf.tidy(() => {
    const input = tf
      .tensor(frame, [1, FEATURES_PER_HAND * 2])
      .toFloat();
    const output = model!.predict(input) as tf.Tensor;
    const prob = (output.dataSync() as Float32Array)[0] ?? 0;
    return prob > threshold;
  });
}

export function unloadRestPoseDetector(): void {
  model?.dispose();
  model = null;
  loadPromise = null;
}
