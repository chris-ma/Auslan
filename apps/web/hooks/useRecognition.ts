"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRecognitionStore } from "@/store/recognitionStore";
import { RecognitionPipeline } from "@/lib/recognition/recognitionPipeline";
import { getHandLandmarker, parseResult } from "@/lib/mediapipe/handLandmarker";

const TARGET_FPS = 24;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function useRecognition(videoRef: React.RefObject<HTMLVideoElement>) {
  const {
    status,
    setStatus,
    setError,
    addSubtitle,
    setFps,
  } = useRecognitionStore();

  const pipelineRef = useRef<RecognitionPipeline | null>(null);
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
      if (!pipelineRef.current) {
        pipelineRef.current = new RecognitionPipeline();
        await pipelineRef.current.init();
      }
      await getHandLandmarker();

      pipelineRef.current.start();
      setStatus("active");

      const loop = async (now: number) => {
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
            const landmarker = await getHandLandmarker();
            const rawResult = landmarker.detectForVideo(
              videoRef.current,
              now
            );
            const result = parseResult(rawResult, now);
            const pipelineResult =
              await pipelineRef.current?.processFrame(result);

            if (pipelineResult) {
              addSubtitle({
                label: pipelineResult.label,
                displayText: pipelineResult.displayText,
                confidence: pipelineResult.confidence,
                timestampMs: pipelineResult.timestampMs,
              });
            }
          } catch (err) {
            console.error("Recognition error:", err);
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setError(`Failed to start recognition: ${err instanceof Error ? err.message : String(err)}`);
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
