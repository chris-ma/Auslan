"use client";

import { useCallback, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useWorkerRecognition } from "@/hooks/useWorkerRecognition";
import { useRecognitionStore } from "@/store/recognitionStore";
import { CameraView } from "@/components/camera/CameraView";
import { CameraPermissionError } from "@/components/camera/CameraPermissionError";
import { ControlBar } from "@/components/camera/ControlBar";
import { LandmarkOverlay } from "@/components/camera/LandmarkOverlay";
import { SettingsPanel } from "@/components/camera/SettingsPanel";
import { SubtitleBar } from "@/components/subtitles/SubtitleBar";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PracticePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasStartedOnce = useRef(false);

  const {
    stream,
    devices,
    activeDeviceId,
    status: cameraStatus,
    errorMessage: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const { status: recognitionStatus, start, stop, lastResult } = useWorkerRecognition(videoRef);

  const {
    subtitles,
    fontSize,
    subtitlePosition,
    subtitleOpacity,
    showConfidence,
    fps,
    errorMessage: recognitionError,
    clearSubtitles,
  } = useRecognitionStore();

  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    },
    []
  );

  const cameraActive = cameraStatus === "active" || cameraStatus === "starting";

  if (cameraActive) hasStartedOnce.current = true;

  const handleToggleCamera = useCallback(() => {
    if (cameraActive) {
      stop();
      stopCamera();
    } else {
      startCamera();
    }
  }, [cameraActive, stop, stopCamera, startCamera]);

  // ── Splash: camera not started yet ───────────────────────────────────────
  if (cameraStatus === "idle" && !hasStartedOnce.current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold">Practice Auslan</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          This page uses your webcam to detect Auslan signs and shows live
          subtitles. No video leaves your device.
        </p>
        <Button size="lg" onClick={() => startCamera()}>
          <Camera className="mr-2 h-5 w-5" aria-hidden />
          Enable camera
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/glossary">See supported signs</Link>
        </Button>
      </div>
    );
  }

  // ── Camera error ──────────────────────────────────────────────────────────
  if (cameraStatus === "error" && cameraError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <CameraPermissionError
            message={cameraError}
            onRetry={() => startCamera()}
          />
        </div>
      </div>
    );
  }

  // ── Full-screen camera view ───────────────────────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Camera feed fills the full viewport */}
      <CameraView
        stream={stream}
        mirrored
        className="absolute inset-0 w-full h-full rounded-none"
        onVideoRef={handleVideoRef}
      />

      {/* Hand landmark skeleton */}
      {recognitionStatus === "active" && (
        <LandmarkOverlay
          result={lastResult}
          videoWidth={640}
          videoHeight={360}
          mirrored
        />
      )}

      {/* Subtitles */}
      <SubtitleBar
        subtitles={subtitles}
        fontSize={fontSize}
        position={subtitlePosition}
        opacity={subtitleOpacity}
        showConfidence={showConfidence}
      />

      {/* Hand detected indicator */}
      {recognitionStatus === "active" && lastResult && lastResult.hands.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" aria-hidden />
          <span className="text-xs text-white/90">Hand detected</span>
        </div>
      )}

      {/* Camera-off overlay */}
      {!cameraActive && hasStartedOnce.current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <CameraOff className="h-10 w-10 text-white/50" aria-hidden />
          <p className="text-sm text-white/60">Camera off</p>
        </div>
      )}

      {/* Model loading overlay */}
      {recognitionStatus === "loading" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60"
          role="status"
          aria-label="Loading recognition models"
        >
          <Loader2 className="h-8 w-8 text-white animate-spin" aria-hidden />
          <p className="text-sm text-white/90 font-medium">
            Loading sign recognition models…
          </p>
          <p className="text-xs text-white/60">First load may take a moment</p>
        </div>
      )}

      {/* Floating header */}
      <header className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <Link
          href="/"
          className="text-sm font-semibold text-white hover:underline pointer-events-auto"
        >
          ← Auslan Live
        </Link>
        <Link
          href="/train"
          className="text-sm text-white/70 hover:text-white hover:underline pointer-events-auto"
        >
          Train your signs →
        </Link>
      </header>

      {/* Recognition error banner */}
      {recognitionStatus === "error" && recognitionError && (
        <div
          role="alert"
          className="absolute top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl flex items-start gap-3 rounded-lg border border-destructive/60 bg-black/80 px-4 py-3"
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm text-red-300">{recognitionError}</p>
        </div>
      )}

      {/* Floating bottom controls */}
      <div className="absolute bottom-0 inset-x-0 px-4 sm:px-8 pb-8 pt-20 bg-gradient-to-t from-black/70 to-transparent">
        {recognitionStatus === "active" && subtitles.length === 0 && (
          <p className="text-sm text-white/70 text-center mb-3">
            Show your hand to the camera and sign slowly.
          </p>
        )}
        {(recognitionStatus === "ready" || recognitionStatus === "idle") && (
          <p className="text-sm text-white/70 text-center mb-3">
            Press <strong className="text-white">Start</strong> and sign one at a time with a brief pause between each.
          </p>
        )}
        <ControlBar
          recognitionStatus={recognitionStatus}
          fps={fps}
          devices={devices}
          activeDeviceId={activeDeviceId}
          cameraActive={cameraActive}
          onStart={start}
          onStop={stop}
          onClear={clearSubtitles}
          onSwitchCamera={switchCamera}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleCamera={handleToggleCamera}
        />
      </div>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
