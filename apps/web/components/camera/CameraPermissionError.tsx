"use client";

import { CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraPermissionErrorProps {
  message: string;
  onRetry?: () => void;
}

export function CameraPermissionError({
  message,
  onRetry,
}: CameraPermissionErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg bg-neutral-900 p-8 text-center"
    >
      <CameraOff className="h-12 w-12 text-destructive" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Camera unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
