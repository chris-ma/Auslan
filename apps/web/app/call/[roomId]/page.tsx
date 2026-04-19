"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCamera } from "@/hooks/useCamera";
import { useCall } from "@/hooks/useCall";
import { useRecognition } from "@/hooks/useRecognition";
import { useRecognitionStore } from "@/store/recognitionStore";
import { useCallStore } from "@/store/callStore";
import { CameraView } from "@/components/camera/CameraView";
import { SubtitleBar } from "@/components/subtitles/SubtitleBar";
import { CallControls } from "@/components/call/CallControls";
import { ConnectionStatus } from "@/components/call/ConnectionStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";

export default function CallRoomPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isHost = searchParams.get("host") === "1";

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  const { stream, startCamera } = useCamera();
  const { status: callStatus, createRoom, joinRoom, sendSubtitle, endCall } =
    useCall(stream);
  const { status: recognitionStatus, start: startRecognition } =
    useRecognition(localVideoRef);

  const { subtitles, clearSubtitles, fontSize, subtitlePosition, subtitleOpacity, showConfidence } =
    useRecognitionStore();
  const { remoteStream, remoteSubtitles, subtitlesAvailable, status } =
    useCallStore();

  // Wire up remote video
  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video || !remoteStream) return;
    video.srcObject = remoteStream;
    video.play().catch(() => {});
  }, [remoteStream]);

  // Relay recognized signs to peer via data channel
  useEffect(() => {
    const unsub = useRecognitionStore.subscribe(
      (state) => state.subtitles,
      (subtitles, prev) => {
        if (subtitles.length > prev.length) {
          const latest = subtitles[subtitles.length - 1];
          if (latest) {
            sendSubtitle(latest.label, latest.displayText, latest.confidence);
          }
        }
      }
    );
    return unsub;
  }, [sendSubtitle]);

  // Initialize call on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await startCamera();
      if (cancelled) return;
      if (isHost) {
        await createRoom();
      } else {
        await joinRoom(params.roomId);
      }
      startRecognition();
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/call/${params.roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndCall = () => {
    endCall();
    clearSubtitles();
    router.push("/call");
  };

  const handleLocalVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    },
    []
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <ConnectionStatus status={status} />
          {(status === "waiting" || status === "creating") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              {copied ? "Copied!" : "Copy invite link"}
            </Button>
          )}
        </div>
        <CallControls localStream={stream} onEndCall={handleEndCall} />
      </header>

      {/* Video grid */}
      <main className="flex-1 flex flex-col sm:flex-row gap-4 p-4">
        {/* Remote video (primary) */}
        <div className="relative flex-1 rounded-lg overflow-hidden bg-neutral-900 min-h-48">
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                aria-label="Remote participant video"
              />
              <SubtitleBar
                subtitles={remoteSubtitles}
                fontSize={fontSize}
                position={subtitlePosition}
                opacity={subtitleOpacity}
                showConfidence={showConfidence}
                label="Remote subtitles"
              />
              {!subtitlesAvailable && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="text-xs">
                    Translation unavailable
                  </Badge>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-neutral-500 text-sm">
                {status === "waiting"
                  ? "Waiting for peer to join…"
                  : status === "connecting"
                  ? "Connecting…"
                  : "No remote video"}
              </p>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture style on mobile, side panel on desktop) */}
        <div className="relative w-full sm:w-64 h-36 sm:h-auto rounded-lg overflow-hidden bg-neutral-900 shrink-0">
          <CameraView
            stream={stream}
            mirrored
            className="absolute inset-0 w-full h-full"
            onVideoRef={handleLocalVideoRef}
          />
          <SubtitleBar
            subtitles={subtitles}
            fontSize="sm"
            position={subtitlePosition}
            opacity={subtitleOpacity}
            showConfidence={false}
            label="Your subtitles"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              You
            </Badge>
          </div>
          {recognitionStatus === "active" && (
            <div className="absolute top-2 right-2">
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block animate-pulse" aria-label="Recognition active" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
