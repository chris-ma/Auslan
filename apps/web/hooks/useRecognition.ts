"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRecognitionStore } from "@/store/recognitionStore";
import { RecognitionPipeline } from "@/lib/recognition/recognitionPipeline";
import { getHandLandmarker, parseResult } from "@/lib/mediapipe/handLandmarker";
import type { HandLandmarker } from "@mediapipe/tasks-vision";

const TARGET_FPS = 24;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function useRecognition(videoRef: React.RefObject<HTMLVideoElement>) {
  const { status, setStatus, setError, addSubtitle, setFps } =
    useRecognitionStore();

  const pipelineRef = useRef<RecognitionPipeline | null>(null);
  // Cache the landmarker so we never re-await the singleton inside the loop
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameTime = useRef(0);
  const fpsFrameCount = useRef(0);
  const fpsTimer = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pipelineRef.current?.stop();
    setStatus("ready");
    setFps(0);
  }, [setStatus, setFps]);

  const start = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus("loading");

    try {
      // Initialise pipeline and landmarker once — both are singletons
      if (!pipelineRef.current) {
        pipelineRef.current = new RecognitionPipeline();
        await pipelineRef.current.init();
      }
      landmarkerRef.current = await getHandLandmarker();

      pipelineRef.current.start();
      setStatus("active");

      // Synchronous RAF loop — no async calls inside the hot path
      const loop = (now: number) => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const elapsed = now - lastFrameTime.current;
        if (elapsed >= FRAME_INTERVAL) {
          lastFrameTime.current = now - (elapsed % FRAME_INTERVAL);

          fpsFrameCount.current++;
          if (now - fpsTimer.current >= 1000) {
            setFps(fpsFrameCount.current);
            fpsFrameCount.current = 0;
            fpsTimer.current = now;
          }

          try {
            const lm = landmarkerRef.current;
            if (!lm) return;
            const rawResult = lm.detectForVideo(videoRef.current, now);
            const result = parseResult(rawResult, now);
            // processFrame is async (TF.js inference) — fire and forget per frame
            pipelineRef.current?.processFrame(result).then((pipelineResult) => {
              if (pipelineResult) {
                addSubtitle({
                  label: pipelineResult.label,
                  displayText: pipelineResult.displayText,
                  confidence: pipelineResult.confidence,
                  timestampMs: pipelineResult.timestampMs,
                });
              }
            });
          } catch (err) {
            console.error("Recognition frame error:", err);
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isModelMissing =
        msg.includes("404") || msg.includes("model.json") || msg.includes("Failed to fetch");
      setError(
        isModelMissing
          ? "Model files not found. Run `python training/src/generate_placeholder_models.py` first."
          : `Failed to start recognition: ${msg}`
      );
      setStatus("error");
    }
  }, [videoRef, setStatus, setError, addSubtitle, setFps]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pipelineRef.current?.stop();
    };
  }, []);

  return { status, start, stop };
}
