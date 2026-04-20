"use client";

import { cn } from "@/lib/utils";
import type { SubtitleEntry, SubtitleFontSize } from "@/store/recognitionStore";

const latestSizeClasses: Record<SubtitleFontSize, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-7xl",
};

const historySizeClasses: Record<SubtitleFontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

interface SubtitleBarProps {
  subtitles: SubtitleEntry[];
  fontSize?: SubtitleFontSize;
  position?: "bottom" | "top";
  opacity?: number;
  showConfidence?: boolean;
  className?: string;
  label?: string;
}

export function SubtitleBar({
  subtitles,
  fontSize = "md",
  opacity = 0.85,
  showConfidence = false,
  className,
  label = "Subtitles",
}: SubtitleBarProps) {
  if (subtitles.length === 0) return null;

  const latest = subtitles[subtitles.length - 1]!;
  const history = subtitles.slice(0, -1);

  return (
    <div
      aria-live="polite"
      aria-label={label}
      className={cn(
        "absolute inset-x-0 flex flex-col items-center gap-3 pointer-events-none",
        "top-16",
        className
      )}
    >
      {/* History strip */}
      {history.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-6 max-w-xl">
          {history.map((entry) => (
            <span
              key={entry.id}
              className={cn(
                "text-yellow-300/50 font-medium",
                historySizeClasses[fontSize]
              )}
            >
              {entry.displayText}
            </span>
          ))}
        </div>
      )}

      {/* Latest word — large, prominent */}
      <div
        className="rounded-2xl px-8 py-4 flex items-center gap-3"
        style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
      >
        <span
          className={cn(
            "subtitle-word font-bold text-yellow-300 leading-none tracking-wide drop-shadow-lg",
            latestSizeClasses[fontSize]
          )}
        >
          {latest.displayText}
        </span>
        {showConfidence && (
          <span className="text-white/60 text-sm font-medium self-end mb-1">
            {Math.round(latest.confidence * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
