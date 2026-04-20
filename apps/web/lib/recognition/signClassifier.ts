import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { SIGN_LABELS, type SignLabel } from "@auslan/vocab";

const MODEL_PATH = "/models/sign-classifier/model.json";
const CONFIDENCE_THRESHOLD = 0.75;

let model: tf.LayersModel | null = null;
let loadPromise: Promise<tf.LayersModel> | null = null;

export class ModelNotFoundError extends Error {
  constructor(path: string) {
    super(
      `Sign classifier model not found at ${path}. ` +
        "Run `python training/src/generate_placeholder_models.py` to create placeholder models."
    );
    this.name = "ModelNotFoundError";
  }
}

export async function loadSignClassifier(): Promise<tf.LayersModel> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await tf.setBackend("webgl");
    await tf.ready();
    try {
      model = await tf.loadLayersModel(MODEL_PATH);
      return model;
    } catch (err) {
      // Reset so callers can retry after placing model files
      loadPromise = null;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("404") || msg.includes("Failed to fetch") || msg.includes("model.json")) {
        throw new ModelNotFoundError(MODEL_PATH);
      }
      throw err;
    }
  })();

  return loadPromise;
}

export interface ClassifierResult {
  label: SignLabel;
  displayText: string;
  confidence: number;
}

/**
 * Runs inference on a [windowSize, featuresPerFrame] snapshot.
 * Returns null when confidence is below threshold or model is unavailable.
 */
export async function classify(
  snapshot: Float32Array,
  windowSize: number,
  featuresPerFrame: number,
  threshold = CONFIDENCE_THRESHOLD
): Promise<ClassifierResult | null> {
  if (!model) return null;

  return tf.tidy(() => {
    const input = tf
      .tensor(snapshot, [1, windowSize, featuresPerFrame])
      .toFloat();
    const output = model!.predict(input) as tf.Tensor;
    const probs = output.dataSync() as Float32Array;

    let maxIdx = 0;
    let maxProb = 0;
    for (let i = 0; i < probs.length; i++) {
      if ((probs[i] ?? 0) > maxProb) {
        maxProb = probs[i] ?? 0;
        maxIdx = i;
      }
    }

    if (maxProb < threshold) return null;

    const label = SIGN_LABELS[maxIdx];
    if (!label) return null;

    return {
      label,
      displayText: label.replace(/-/g, " "),
      confidence: maxProb,
    };
  }) as unknown as ClassifierResult | null;
}

export function isModelLoaded(): boolean {
  return model !== null;
}

export function unloadSignClassifier(): void {
  model?.dispose();
  model = null;
  loadPromise = null;
}
