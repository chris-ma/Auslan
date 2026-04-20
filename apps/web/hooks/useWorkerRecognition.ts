"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRecognitionStore } from "@/store/recognitionStore";
import { RecognitionPipeline } from "@/lib/recognition/recognitionPipeline";
import type { LandmarkerResult } from "@/lib/mediapipe/types";

const TARGET_FPS = 24;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Resolution sent to the worker — 16:9 to match the camera stream (no squish distortion)
const WORKER_WIDTH = 320;
const WORKER_HEIGHT = 180;

/**
 * Drop-in replacement for useRecognition that runs MediaPipe HandLandmarker
 * inside a Web Worker via OffscreenCanvas + ImageBitmap transfer.
 * Keeps the main thread free for UI rendering.
 */
export function useWorkerRecognition(
  videoRef: React.RefObject<HTMLVideoElement>
) {
  const { status, setStatus, setError, addSubtitle, setFps } =
    useRecognitionStore();

  const [lastResult, setLastResult] = useState<LandmarkerResult | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const pipelineRef = useRef<RecognitionPipeline | null>(null);
  const rafRef = useRef<number>(0);
  const workerReadyRef = useRef(false);
  const workerBusyRef = useRef(false); // one frame in-flight at a time
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
      // Init pipeline (TF.js models load here)
      if (!pipelineRef.current) {
        pipelineRef.current = new RecognitionPipeline();
        await pipelineRef.current.init();
      }

      // Create the Web Worker
      const worker = new Worker(
        new URL("../lib/workers/landmarkerWorker.ts", import.meta.url)
      );
      workerRef.current = worker;
      workerReadyRef.current = false;
      workerBusyRef.current = false;

      // Transfer an OffscreenCanvas to the worker for drawing frames onto
      const offscreen = new OffscreenCanvas(WORKER_WIDTH, WORKER_HEIGHT);
      worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

      // Handle messages from the worker
      worker.onmessage = async (
        e: MessageEvent<
          | { type: "ready" }
          | { type: "error"; message: string }
          | { type: "result"; payload: LandmarkerResult }
          | { type: "destroyed" }
        >
      ) => {
        if (e.data.type === "ready") {
          workerReadyRef.current = true;
          pipelineRef.current!.start();
          setStatus("active");

          const loop = (now: number) => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              rafRef.current = requestAnimationFrame(loop);
              return;
            }

            const elapsed = now - lastFrameTime.current;
            if (elapsed >= FRAME_INTERVAL && !workerBusyRef.current) {
              lastFrameTime.current = now - (elapsed % FRAME_INTERVAL);

              fpsFrameCount.current++;
              if (now - fpsTimer.current >= 1000) {
                setFps(fpsFrameCount.current);
                fpsFrameCount.current = 0;
                fpsTimer.current = now;
              }

              // createImageBitmap resizes the frame cheaply on the GPU before transfer
              createImageBitmap(videoRef.current, {
                resizeWidth: WORKER_WIDTH,
                resizeHeight: WORKER_HEIGHT,
                resizeQuality: "pixelated",
              })
                .then((bitmap) => {
                  workerBusyRef.current = true;
                  worker.postMessage(
                    { type: "frame", bitmap, timestampMs: now },
                    [bitmap]
                  );
                })
                .catch(() => {
                  workerBusyRef.current = false;
                });
            }

            rafRef.current = requestAnimationFrame(loop);
          };

          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (e.data.type === "error") {
          setError(`HandLandmarker worker error: ${e.data.message}`);
          setStatus("error");
          return;
        }

        if (e.data.type === "result") {
          workerBusyRef.current = false;
          setLastResult(e.data.payload);
          const pipelineResult =
            await pipelineRef.current?.processFrame(e.data.payload);
          if (pipelineResult) {
            addSubtitle({
              label: pipelineResult.label,
              displayText: pipelineResult.displayText,
              confidence: pipelineResult.confidence,
              timestampMs: pipelineResult.timestampMs,
            });
          }
        }
      };

      worker.onerror = (err) => {
        setError(`Worker crashed: ${err.message}`);
        setStatus("error");
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isModelMissing =
        msg.includes("404") ||
        msg.includes("model.json") ||
        msg.includes("Failed to fetch");
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
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "destroy" });
        // Give the worker a moment to clean up before terminating
        setTimeout(() => workerRef.current?.terminate(), 500);
        workerRef.current = null;
      }
    };
  }, []);

  return { status, start, stop, lastResult };
}
