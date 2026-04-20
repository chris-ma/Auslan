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
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <Link href="/" className="text-sm font-semibold hover:underline">
          ← Auslan Live
        </Link>
        <span className="text-sm text-muted-foreground">Practice mode</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-6">
        {/* Video + subtitle container */}
        <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden bg-neutral-900 shadow-xl">
          <CameraView
            stream={stream}
            mirrored
            className="absolute inset-0 w-full h-full"
            onVideoRef={handleVideoRef}
          />

          {recognitionStatus === "active" && (
            <LandmarkOverlay
              result={lastResult}
              videoWidth={640}
              videoHeight={480}
              mirrored
            />
          )}

          <SubtitleBar
            subtitles={subtitles}
            fontSize={fontSize}
            position={subtitlePosition}
            opacity={subtitleOpacity}
            showConfidence={showConfidence}
          />

          {/* Camera-off overlay (shown after first use) */}
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
        </div>

        {/* Recognition error banner */}
        {recognitionStatus === "error" && recognitionError && (
          <div
            role="alert"
            className="w-full max-w-2xl flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
          >
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-destructive">{recognitionError}</p>
          </div>
        )}

        {/* Control bar */}
        <div className="w-full max-w-2xl">
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

        {/* Contextual hints */}
        {(recognitionStatus === "ready" || recognitionStatus === "idle") && (
          <p className="text-sm text-muted-foreground">
            Press <strong>Start</strong> and perform Auslan signs one at a time
            with a brief pause between each.{" "}
            <Link href="/glossary" className="underline">
              See supported signs
            </Link>
          </p>
        )}
        {recognitionStatus === "active" && subtitles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Show your hand to the camera and sign slowly.{" "}
            <Badge variant="outline" className="text-xs">
              Tip: keep your hand centred in frame
            </Badge>
          </p>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
