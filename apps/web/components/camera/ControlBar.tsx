"use client";

import { Play, Square, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { RecognitionStatus } from "@/store/recognitionStore";

interface ControlBarProps {
  recognitionStatus: RecognitionStatus;
  fps: number;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onSwitchCamera: (deviceId: string) => void;
  onOpenSettings: () => void;
}

export function ControlBar({
  recognitionStatus,
  fps,
  devices,
  activeDeviceId,
  onStart,
  onStop,
  onClear,
  onSwitchCamera,
  onOpenSettings,
}: ControlBarProps) {
  const isActive = recognitionStatus === "active";
  const isLoading = recognitionStatus === "loading";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Recognition toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            onClick={isActive ? onStop : onStart}
            disabled={isLoading}
            aria-label={isActive ? "Stop recognition" : "Start recognition"}
            aria-pressed={isActive}
          >
            {isActive ? (
              <>
                <Square className="mr-2 h-4 w-4" aria-hidden />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" aria-hidden />
                {isLoading ? "Loading…" : "Start"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isActive ? "Stop sign recognition" : "Start sign recognition"}
        </TooltipContent>
      </Tooltip>

      {/* FPS indicator */}
      {isActive && (
        <Badge variant={fps >= 15 ? "success" : "warning"} aria-label={`${fps} frames per second`}>
          {fps} fps
        </Badge>
      )}

      {/* Camera selector */}
      {devices.length > 1 && (
        <Select value={activeDeviceId ?? ""} onValueChange={onSwitchCamera}>
          <SelectTrigger className="w-44 h-9 text-sm" aria-label="Select camera">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex-1" />

      {/* Clear subtitles */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="Clear subtitles"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear subtitles</TooltipContent>
      </Tooltip>

      {/* Settings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </div>
  );
}
