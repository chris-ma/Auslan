import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

const FEATURES_PER_FRAME = 126;
const STAGE2_FRAMES = 15;
const STAGE3_FRAMES = 45;

const LABEL_KEY = (stage: 1 | 2 | 3) => `auslan-stage${stage}-labels`;

export function buildStage1Model(numClasses: number): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [FEATURES_PER_FRAME], units: 256, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));
  return model;
}

export function buildStage2Model(numClasses: number): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    inputShape: [STAGE2_FRAMES, FEATURES_PER_FRAME],
    units: 64,
    returnSequences: false,
  }));
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));
  return model;
}

export function buildStage3Model(numClasses: number): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    inputShape: [STAGE3_FRAMES, FEATURES_PER_FRAME],
    units: 128,
    returnSequences: true,
  }));
  model.add(tf.layers.lstm({ units: 64, returnSequences: false }));
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.4 }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));
  return model;
}

export async function saveStageModel(
  stage: 1 | 2 | 3,
  model: tf.LayersModel,
  labels: string[]
): Promise<void> {
  await model.save(`indexeddb://auslan-stage${stage}`);
  localStorage.setItem(LABEL_KEY(stage), JSON.stringify(labels));
}

export async function loadStageModel(
  stage: 1 | 2 | 3
): Promise<{ model: tf.LayersModel; labels: string[] } | null> {
  try {
    await tf.setBackend("webgl");
    await tf.ready();
    const model = await tf.loadLayersModel(`indexeddb://auslan-stage${stage}`);
    const raw = localStorage.getItem(LABEL_KEY(stage));
    if (!raw) return null;
    const labels: string[] = JSON.parse(raw);
    return { model, labels };
  } catch {
    return null;
  }
}

export async function deleteStageModel(stage: 1 | 2 | 3): Promise<void> {
  try {
    await tf.io.removeModel(`indexeddb://auslan-stage${stage}`);
  } catch {
    // model may not exist
  }
  localStorage.removeItem(LABEL_KEY(stage));
}

export function hasTrainedModel(stage: 1 | 2 | 3): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LABEL_KEY(stage)) !== null;
}
