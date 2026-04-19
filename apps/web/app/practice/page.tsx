"use client";

import { useCallback, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useRecognition } from "@/hooks/useRecognition";
import { useRecognitionStore } from "@/store/recognitionStore";
import { CameraView } from "@/components/camera/CameraView";
import { CameraPermissionError } from "@/components/camera/CameraPermissionError";
import { ControlBar } from "@/components/camera/ControlBar";
import { SettingsPanel } from "@/components/camera/SettingsPanel";
import { SubtitleBar } from "@/components/subtitles/SubtitleBar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Link from "next/link";

export default function PracticePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    stream,
    devices,
    activeDeviceId,
    status: cameraStatus,
    errorMessage,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const { status: recognitionStatus, start, stop } = useRecognition(videoRef);

  const {
    subtitles,
    fontSize,
    subtitlePosition,
    subtitleOpacity,
    showConfidence,
    fps,
    clearSubtitles,
  } = useRecognitionStore();

  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    },
    []
  );

  if (cameraStatus === "idle") {
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

  if (cameraStatus === "error" && errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <CameraPermissionError
            message={errorMessage}
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

          <SubtitleBar
            subtitles={subtitles}
            fontSize={fontSize}
            position={subtitlePosition}
            opacity={subtitleOpacity}
            showConfidence={showConfidence}
          />
        </div>

        {/* Control bar */}
        <div className="w-full max-w-2xl">
          <ControlBar
            recognitionStatus={recognitionStatus}
            fps={fps}
            devices={devices}
            activeDeviceId={activeDeviceId}
            onStart={start}
            onStop={stop}
            onClear={clearSubtitles}
            onSwitchCamera={switchCamera}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>

        {/* Usage hint */}
        {recognitionStatus === "ready" || recognitionStatus === "idle" ? (
          <p className="text-sm text-muted-foreground">
            Press <strong>Start</strong> and perform Auslan signs one at a time
            with a brief pause between each.{" "}
            <Link href="/glossary" className="underline">
              See supported signs
            </Link>
          </p>
        ) : null}
      </main>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
