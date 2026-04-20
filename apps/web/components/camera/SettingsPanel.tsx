"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useRecognitionStore } from "@/store/recognitionStore";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const {
    fontSize,
    subtitlePosition,
    subtitleOpacity,
    showConfidence,
    confidenceThreshold,
    setFontSize,
    setSubtitlePosition,
    setSubtitleOpacity,
    setShowConfidence,
    setConfidenceThreshold,
  } = useRecognitionStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customise subtitle display and recognition sensitivity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Font size */}
          <div>
            <p className="mb-2 text-sm font-medium">Subtitle size</p>
            <div className="flex gap-2">
              {(["sm", "md", "lg"] as const).map((size) => (
                <Toggle
                  key={size}
                  pressed={fontSize === size}
                  onPressedChange={() => setFontSize(size)}
                  variant="outline"
                  size="sm"
                  aria-label={`Font size ${size}`}
                >
                  {size.toUpperCase()}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="mb-2 text-sm font-medium">Subtitle position</p>
            <div className="flex gap-2">
              {(["bottom", "top"] as const).map((pos) => (
                <Toggle
                  key={pos}
                  pressed={subtitlePosition === pos}
                  onPressedChange={() => setSubtitlePosition(pos)}
                  variant="outline"
                  size="sm"
                  aria-label={`Subtitle at ${pos}`}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Background opacity{" "}
              <span className="text-muted-foreground">
                {Math.round(subtitleOpacity * 100)}%
              </span>
            </p>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[subtitleOpacity]}
              onValueChange={([v]) => v !== undefined && setSubtitleOpacity(v)}
              aria-label="Subtitle background opacity"
            />
          </div>

          {/* Confidence display */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Show confidence scores</p>
            <Switch
              checked={showConfidence}
              onCheckedChange={setShowConfidence}
              aria-label="Toggle confidence score display"
            />
          </div>

          {/* Confidence threshold */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Confidence threshold{" "}
              <span className="text-muted-foreground">
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </p>
            <Slider
              min={0.05}
              max={0.95}
              step={0.05}
              value={[confidenceThreshold]}
              onValueChange={([v]) =>
                v !== undefined && setConfidenceThreshold(v)
              }
              aria-label="Confidence threshold"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Lower this if signs aren&apos;t being picked up. Raise it to reduce false positives.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
