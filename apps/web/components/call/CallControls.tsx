"use client";

import { PhoneOff, Mic, MicOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallControlsProps {
  localStream: MediaStream | null;
  onEndCall: () => void;
}

export function CallControls({ localStream, onEndCall }: CallControlsProps) {
  const [micMuted, setMicMuted] = useState(false);

  const toggleMic = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    const next = !micMuted;
    audioTracks.forEach((t) => (t.enabled = !next));
    setMicMuted(next);
  };

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMic}
            aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={micMuted}
          >
            {micMuted ? (
              <MicOff className="h-4 w-4 text-destructive" aria-hidden />
            ) : (
              <Mic className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{micMuted ? "Unmute" : "Mute"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndCall}
            aria-label="End call"
          >
            <PhoneOff className="mr-2 h-4 w-4" aria-hidden />
            End call
          </Button>
        </TooltipTrigger>
        <TooltipContent>End the call</TooltipContent>
      </Tooltip>
    </div>
  );
}
