"use client";

import { cn } from "@/lib/utils";
import type { SubtitleEntry } from "@/store/recognitionStore";
import type { SubtitleFontSize, SubtitlePosition } from "@/store/recognitionStore";

const fontSizeClasses: Record<SubtitleFontSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

interface SubtitleBarProps {
  subtitles: SubtitleEntry[];
  fontSize?: SubtitleFontSize;
  position?: SubtitlePosition;
  opacity?: number;
  showConfidence?: boolean;
  className?: string;
  label?: string;
}

export function SubtitleBar({
  subtitles,
  fontSize = "md",
  position = "bottom",
  opacity = 0.85,
  showConfidence = false,
  className,
  label = "Subtitles",
}: SubtitleBarProps) {
  if (subtitles.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label={label}
      style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
      className={cn(
        "absolute left-0 right-0 px-4 py-3 flex flex-wrap gap-x-2 gap-y-1 justify-center",
        position === "bottom" ? "bottom-0 rounded-b-lg" : "top-0 rounded-t-lg",
        className
      )}
    >
      {subtitles.map((entry) => (
        <span
          key={entry.id}
          className={cn(
            "subtitle-word font-semibold text-white drop-shadow",
            fontSizeClasses[fontSize]
          )}
        >
          {entry.displayText}
          {showConfidence && (
            <sup className="ml-0.5 text-xs text-white/60">
              {Math.round(entry.confidence * 100)}%
            </sup>
          )}
        </span>
      ))}
    </div>
  );
}
