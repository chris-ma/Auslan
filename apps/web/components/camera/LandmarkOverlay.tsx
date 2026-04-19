"use client";

import { useEffect, useRef } from "react";
import type { LandmarkerResult, Landmark } from "@/lib/mediapipe/types";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [5, 9], [9, 10], [10, 11], [11, 12],  // middle
  [9, 13], [13, 14], [14, 15], [15, 16],// ring
  [13, 17], [17, 18], [18, 19], [19, 20],// pinky
  [0, 17],                               // palm
] as const;

interface LandmarkOverlayProps {
  result: LandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  mirrored?: boolean;
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  w: number,
  h: number,
  mirrored: boolean
) {
  const x = (lm: Landmark) => (mirrored ? 1 - lm.x : lm.x) * w;
  const y = (lm: Landmark) => lm.y * h;

  ctx.strokeStyle = "rgba(99,179,237,0.85)";
  ctx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) continue;
    ctx.beginPath();
    ctx.moveTo(x(la), y(la));
    ctx.lineTo(x(lb), y(lb));
    ctx.stroke();
  }

  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(x(lm), y(lm), 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
  }
}

export function LandmarkOverlay({
  result,
  videoWidth,
  videoHeight,
  mirrored = true,
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!result || result.hands.length === 0) return;

    for (const hand of result.hands) {
      drawHand(ctx, hand.landmarks, canvas.width, canvas.height, mirrored);
    }
  }, [result, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className="landmark-canvas"
      aria-hidden
    />
  );
}
