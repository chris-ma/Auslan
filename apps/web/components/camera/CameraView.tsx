"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  stream: MediaStream | null;
  mirrored?: boolean;
  className?: string;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

export function CameraView({
  stream,
  mirrored = true,
  className,
  onVideoRef,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {/* autoplay may be blocked, user will see paused frame */});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    onVideoRef?.(videoRef.current);
    return () => onVideoRef?.(null);
  }, [onVideoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        "w-full h-full object-cover rounded-lg bg-neutral-900",
        mirrored && "video-mirror",
        className
      )}
      aria-label="Camera feed"
    />
  );
}
