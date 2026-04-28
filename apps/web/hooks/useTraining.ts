"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFeatureVector } from "@/lib/recognition/normalizer";
import {
  saveSample,
  countByLabelForStage,
  deleteSamplesForStage,
} from "@/lib/training/trainingDb";
import { trainStage as runTrainStage, type TrainProgress } from "@/lib/training/trainer";
import { hasTrainedModel } from "@/lib/training/stageModels";
import type { LandmarkerResult } from "@/lib/mediapipe/types";
import type { RecognitionPipeline } from "@/lib/recognition/recognitionPipeline";

const FRAMES_NEEDED: Record<1 | 2 | 3, number> = { 1: 1, 2: 15, 3: 45 };
const MIN_SAMPLES: Record<1 | 2 | 3, number> = { 1: 5, 2: 8, 3: 10 };

export interface UseTrainingReturn {
  selectedStage: 1 | 2 | 3;
  setSelectedStage: (s: 1 | 2 | 3) => void;
  selectedLabel: string;
  setSelectedLabel: (l: string) => void;

  isRecording: boolean;
  recordingFrameCount: number;
  startRecording: () => void;
  stopRecording: () => void;

  sampleCounts: Map<string, number>;
  minSamplesForStage: number;
  refreshCounts: () => Promise<void>;
  deleteSamples: (label?: string) => Promise<void>;

  isTraining: boolean;
  trainingProgress: TrainProgress | null;
  trainStage: () => Promise<void>;
  trainedStages: Set<1 | 2 | 3>;
  trainingError: string | null;
}

export function useTraining(
  lastResult: LandmarkerResult | null,
  pipelineRef: React.RefObject<RecognitionPipeline | null>
): UseTrainingReturn {
  const [selectedStage, setSelectedStageRaw] = useState<1 | 2 | 3>(1);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFrameCount, setRecordingFrameCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState<Map<string, number>>(new Map());
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainProgress | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainedStages, setTrainedStages] = useState<Set<1 | 2 | 3>>(
    () => new Set(([1, 2, 3] as const).filter(hasTrainedModel))
  );

  const frameAccumulator = useRef<Float32Array[]>([]);
  const isRecordingRef = useRef(false);
  const stageRef = useRef<1 | 2 | 3>(1);
  const labelRef = useRef<string>("");

  const setSelectedStage = useCallback((s: 1 | 2 | 3) => {
    setSelectedStageRaw(s);
    stageRef.current = s;
  }, []);

  useEffect(() => {
    stageRef.current = selectedStage;
  }, [selectedStage]);

  useEffect(() => {
    labelRef.current = selectedLabel;
  }, [selectedLabel]);

  const refreshCounts = useCallback(async () => {
    const counts = await countByLabelForStage(stageRef.current);
    setSampleCounts(new Map(counts));
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [selectedStage, refreshCounts]);

  // Capture frames while recording
  useEffect(() => {
    if (!isRecording || !lastResult || lastResult.hands.length === 0) return;

    const frame = buildFeatureVector(lastResult.hands);
    frameAccumulator.current.push(frame);

    const needed = FRAMES_NEEDED[stageRef.current];
    setRecordingFrameCount(frameAccumulator.current.length);

    if (frameAccumulator.current.length >= needed) {
      // Enough frames collected — save sample and reset
      const totalFloats = needed * 126;
      const combined = new Float32Array(totalFloats);
      for (let i = 0; i < needed; i++) {
        combined.set(frameAccumulator.current[i]!, i * 126);
      }
      frameAccumulator.current = [];

      const stage = stageRef.current;
      const label = labelRef.current;
      if (label) {
        saveSample(stage, label, combined).then(() => {
          refreshCounts();
        });
      }

      // For stage 1, keep recording (accumulate more single-frame samples until stopRecording)
      if (stage !== 1) {
        isRecordingRef.current = false;
        setIsRecording(false);
        setRecordingFrameCount(0);
      }
    }
  }, [lastResult, isRecording, refreshCounts]);

  const startRecording = useCallback(() => {
    if (!labelRef.current) return;
    frameAccumulator.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingFrameCount(0);
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setRecordingFrameCount(0);
    frameAccumulator.current = [];
  }, []);

  const deleteSamples = useCallback(
    async (label?: string) => {
      await deleteSamplesForStage(stageRef.current, label);
      await refreshCounts();
    },
    [refreshCounts]
  );

  const trainStage = useCallback(async () => {
    setIsTraining(true);
    setTrainingProgress(null);
    setTrainingError(null);
    try {
      await runTrainStage(stageRef.current, (p) => setTrainingProgress(p));
      setTrainedStages((prev) => new Set([...prev, stageRef.current]));
      // Hot-reload into the live pipeline if one is running
      await pipelineRef.current?.reloadTrainedModels();
    } catch (err) {
      setTrainingError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTraining(false);
    }
  }, [pipelineRef]);

  return {
    selectedStage,
    setSelectedStage,
    selectedLabel,
    setSelectedLabel,
    isRecording,
    recordingFrameCount,
    startRecording,
    stopRecording,
    sampleCounts,
    minSamplesForStage: MIN_SAMPLES[selectedStage],
    refreshCounts,
    deleteSamples,
    isTraining,
    trainingProgress,
    trainStage,
    trainedStages,
    trainingError,
  };
}
