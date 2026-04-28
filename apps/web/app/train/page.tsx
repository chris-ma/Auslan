"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Mic, Circle, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useWorkerRecognition } from "@/hooks/useWorkerRecognition";
import { useTraining } from "@/hooks/useTraining";
import { CameraView } from "@/components/camera/CameraView";
import { LandmarkOverlay } from "@/components/camera/LandmarkOverlay";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SIGNS } from "@auslan/vocab";

const STAGE_INFO = {
  1: { label: "Static",  desc: "Single handshape — no movement", color: "bg-blue-600",   textColor: "text-blue-400"   },
  2: { label: "Short",   desc: "15-frame brief motion gesture",  color: "bg-purple-600", textColor: "text-purple-400" },
  3: { label: "Full",    desc: "45-frame complete word sign",    color: "bg-orange-600", textColor: "text-orange-400" },
} as const;

export default function TrainPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { stream, status: cameraStatus, startCamera } = useCamera();
  const { status: recognitionStatus, start: startRecognition, lastResult, pipelineRef } =
    useWorkerRecognition(videoRef);

  const training = useTraining(lastResult, pipelineRef);

  const handleVideoRef = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleTrain = useCallback(async () => {
    await training.trainStage();
    if (!training.trainingError) showToast(`Stage ${training.selectedStage} model saved ✓`);
  }, [training, showToast]);

  const cameraActive = cameraStatus === "active" || cameraStatus === "starting";

  // ── Splash ──────────────────────────────────────────────────────────────
  if (!cameraActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold text-center">Train Your Signs</h1>
        <p className="text-muted-foreground text-center max-w-sm text-sm">
          Record gesture samples then train a personalised model — all in your browser.
          No data leaves your device.
        </p>
        <Button size="lg" onClick={() => startCamera()} className="w-full max-w-xs">
          <Camera className="mr-2 h-5 w-5" aria-hidden />
          Enable camera
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/practice">← Back to practice</Link>
        </Button>
      </div>
    );
  }

  const { selectedStage } = training;
  const stageInfo = STAGE_INFO[selectedStage];
  const minSamples = training.minSamplesForStage;
  const qualifiedCount = [...training.sampleCounts.entries()].filter(([, n]) => n >= minSamples).length;
  const canTrain = qualifiedCount >= 2 && !training.isTraining;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <Link href="/practice" className="text-xs sm:text-sm text-muted-foreground hover:underline">
          ← Practice
        </Link>
        <h1 className="text-base sm:text-lg font-semibold">Train Your Signs</h1>
        <span className="text-xs text-muted-foreground hidden sm:block">In-browser</span>
        <span className="sm:hidden w-16" /> {/* spacer to centre the title on mobile */}
      </header>

      {/* Stage tabs */}
      <div className="flex gap-1.5 px-3 py-2 border-b bg-muted/30 shrink-0 overflow-x-auto">
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            onClick={() => training.setSelectedStage(s)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
              selectedStage === s
                ? `${STAGE_INFO[s].color} text-white`
                : "bg-transparent text-muted-foreground hover:bg-accent active:bg-accent",
            ].join(" ")}
          >
            <span className="font-bold">{s}</span>
            <span>{STAGE_INFO[s].label}</span>
            {training.trainedStages.has(s) && <CheckCircle2 className="h-3 w-3 text-green-300" />}
          </button>
        ))}
      </div>

      {/* Main — stacks vertically on mobile, side-by-side on md+ */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Camera panel */}
        <div className="relative bg-black h-56 sm:h-72 md:h-auto md:flex-1">
          <CameraView
            stream={stream}
            mirrored
            className="absolute inset-0 w-full h-full rounded-none object-cover"
            onVideoRef={handleVideoRef}
          />

          {recognitionStatus === "active" && (
            <LandmarkOverlay result={lastResult} videoWidth={640} videoHeight={360} mirrored />
          )}

          {recognitionStatus !== "active" && recognitionStatus !== "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button variant="secondary" onClick={startRecognition} className="gap-2">
                <Mic className="h-4 w-4" />
                Enable hand tracking
              </Button>
            </div>
          )}

          {recognitionStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {training.isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1.5">
              <Circle className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-xs text-white font-mono">REC {training.recordingFrameCount}</span>
            </div>
          )}

          {recognitionStatus === "active" && lastResult && lastResult.hands.length > 0 && !training.isRecording && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/80">Hand detected</span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 bg-black/70 rounded-lg px-2.5 py-1.5 max-w-[160px] hidden sm:block">
            <p className={`text-xs font-semibold ${stageInfo.textColor}`}>Stage {selectedStage} — {stageInfo.label}</p>
            <p className="text-xs text-white/60 mt-0.5">{stageInfo.desc}</p>
          </div>
        </div>

        {/* Controls panel — full width below camera on mobile, fixed sidebar on desktop */}
        <div className="w-full md:w-80 flex flex-col border-t md:border-t-0 md:border-l bg-background overflow-y-auto">

          {/* Sign picker + record */}
          <div className="p-4 border-b">
            <p className="text-xs text-muted-foreground mb-2">Sign to record</p>
            <Select value={training.selectedLabel} onValueChange={training.setSelectedLabel}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a sign…" />
              </SelectTrigger>
              <SelectContent>
                {SIGNS.map((s) => (
                  <SelectItem key={s.label} value={s.label}>{s.displayText}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {training.selectedLabel && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {training.sampleCounts.get(training.selectedLabel) ?? 0} / {minSamples} samples
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                className="flex-1 gap-1.5 min-h-[44px]"
                disabled={!training.selectedLabel || recognitionStatus !== "active" || training.isTraining}
                onMouseDown={training.startRecording}
                onMouseUp={training.stopRecording}
                onTouchStart={(e) => { e.preventDefault(); training.startRecording(); }}
                onTouchEnd={training.stopRecording}
              >
                <Circle className="h-3.5 w-3.5 fill-current" />
                {training.isRecording
                  ? selectedStage === 1 ? "Recording…" : `Collecting… ${training.recordingFrameCount}`
                  : "Hold to Record"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                disabled={!training.selectedLabel || training.isTraining}
                onClick={() => training.deleteSamples(training.selectedLabel)}
                title="Clear samples for this sign"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sample counts */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Samples — Stage {selectedStage}
              </p>
              {training.sampleCounts.size > 0 && (
                <button className="text-xs text-destructive hover:underline" onClick={() => training.deleteSamples()}>
                  Clear all
                </button>
              )}
            </div>

            {training.sampleCounts.size === 0 ? (
              <p className="text-xs text-muted-foreground">No samples yet. Pick a sign and hold Record.</p>
            ) : (
              <ul className="space-y-1.5">
                {[...training.sampleCounts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                  const pct = Math.min(100, (count / minSamples) * 100);
                  const ready = count >= minSamples;
                  return (
                    <li key={label} className="flex items-center gap-2">
                      <span className="text-xs w-20 sm:w-24 truncate text-foreground">
                        {SIGNS.find((s) => s.label === label)?.displayText ?? label}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ready ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs tabular-nums w-6 text-right ${ready ? "text-green-500" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Training controls */}
          <div className="p-4 border-t space-y-3 shrink-0">
            {qualifiedCount < 2 && (
              <p className="text-xs text-muted-foreground">
                Record {minSamples}+ samples for at least 2 signs to enable training. ({qualifiedCount}/2 ready)
              </p>
            )}

            <Button className="w-full gap-2 min-h-[44px]" disabled={!canTrain} onClick={handleTrain}>
              {training.isTraining ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Training…</>
              ) : (
                `Train Stage ${selectedStage}`
              )}
            </Button>

            {training.isTraining && training.trainingProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Epoch {training.trainingProgress.epoch} / {training.trainingProgress.totalEpochs}</span>
                  <span>acc {(training.trainingProgress.acc * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stageInfo.color}`}
                    style={{ width: `${(training.trainingProgress.epoch / training.trainingProgress.totalEpochs) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">loss {training.trainingProgress.loss.toFixed(4)}</p>
              </div>
            )}

            {training.trainingError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{training.trainingError}</p>
              </div>
            )}

            {training.trainedStages.has(selectedStage) && !training.isTraining && (
              <p className="text-xs text-green-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Stage {selectedStage} model active in practice
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-700 text-white text-sm rounded-full px-5 py-2 shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
