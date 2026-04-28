import * as tf from "@tensorflow/tfjs";
import { getSamplesForStage } from "./trainingDb";
import {
  buildStage1Model,
  buildStage2Model,
  buildStage3Model,
  saveStageModel,
} from "./stageModels";

export interface TrainProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  acc: number;
}

type ProgressCb = (p: TrainProgress) => void;

const MIN_SAMPLES: Record<1 | 2 | 3, number> = { 1: 5, 2: 8, 3: 10 };
const EPOCHS: Record<1 | 2 | 3, number> = { 1: 20, 2: 30, 3: 40 };
const FEATURES_PER_FRAME = 126;
const FRAMES: Record<1 | 2 | 3, number> = { 1: 1, 2: 15, 3: 45 };

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function trainStage(
  stage: 1 | 2 | 3,
  onProgress: ProgressCb
): Promise<{ model: tf.LayersModel; labels: string[] }> {
  await tf.setBackend("webgl");
  await tf.ready();

  const samples = await getSamplesForStage(stage);
  const minSamples = MIN_SAMPLES[stage];
  const framesNeeded = FRAMES[stage];
  const totalFloats = framesNeeded * FEATURES_PER_FRAME;

  // Group by label, filter those below minimum
  const grouped = new Map<string, Float32Array[]>();
  for (const s of samples) {
    if (s.frames.length !== totalFloats) continue;
    const arr = grouped.get(s.label) ?? [];
    arr.push(s.frames);
    grouped.set(s.label, arr);
  }

  const qualifiedLabels = [...grouped.entries()]
    .filter(([, arr]) => arr.length >= minSamples)
    .map(([label]) => label)
    .sort();

  if (qualifiedLabels.length < 2) {
    throw new Error(
      `Need at least 2 signs with ${minSamples}+ samples each for Stage ${stage}. ` +
        `Currently qualified: ${qualifiedLabels.length}`
    );
  }

  const numClasses = qualifiedLabels.length;
  const labelToIdx = new Map(qualifiedLabels.map((l, i) => [l, i]));

  // Build dataset
  type Pair = { x: Float32Array; y: number };
  const pairs: Pair[] = [];
  for (const label of qualifiedLabels) {
    const labelSamples = grouped.get(label)!;
    const y = labelToIdx.get(label)!;
    for (const x of labelSamples) {
      pairs.push({ x, y });
    }
  }
  shuffle(pairs);

  const splitAt = Math.floor(pairs.length * 0.8);
  const trainPairs = pairs.slice(0, splitAt);
  const valPairs = pairs.slice(splitAt);

  function toTensors(p: Pair[]) {
    const xs = new Float32Array(p.length * totalFloats);
    const ys = new Int32Array(p.length);
    for (let i = 0; i < p.length; i++) {
      xs.set(p[i]!.x, i * totalFloats);
      ys[i] = p[i]!.y;
    }
    const xShape: number[] =
      stage === 1
        ? [p.length, FEATURES_PER_FRAME]
        : [p.length, framesNeeded, FEATURES_PER_FRAME];
    return {
      xs: tf.tensor(xs, xShape),
      ys: tf.tensor1d(ys, "int32"),
    };
  }

  const { xs: xTrain, ys: yTrain } = toTensors(trainPairs);
  const { xs: xVal, ys: yVal } = toTensors(valPairs);

  const model =
    stage === 1
      ? buildStage1Model(numClasses)
      : stage === 2
      ? buildStage2Model(numClasses)
      : buildStage3Model(numClasses);

  model.compile({
    optimizer: "adam",
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  const totalEpochs = EPOCHS[stage];
  await model.fit(xTrain, yTrain, {
    epochs: totalEpochs,
    batchSize: 32,
    validationData: [xVal, yVal],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onProgress({
          epoch: epoch + 1,
          totalEpochs,
          loss: logs?.["loss"] ?? 0,
          acc: logs?.["acc"] ?? logs?.["accuracy"] ?? 0,
        });
      },
    },
  });

  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();

  await saveStageModel(stage, model, qualifiedLabels);
  return { model, labels: qualifiedLabels };
}
