"use client";

import { Badge } from "@/components/ui/badge";
import type { CallStatus } from "@/store/callStore";

const STATUS_LABELS: Record<CallStatus, string> = {
  idle: "Idle",
  creating: "Creating room…",
  waiting: "Waiting for peer…",
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Disconnected",
  reconnecting: "Reconnecting…",
  ended: "Call ended",
};

const STATUS_VARIANTS: Record<
  CallStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  idle: "secondary",
  creating: "secondary",
  waiting: "outline",
  connecting: "warning",
  connected: "success",
  disconnected: "destructive",
  reconnecting: "warning",
  ended: "secondary",
};

interface ConnectionStatusProps {
  status: CallStatus;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} aria-live="polite" aria-label={`Call status: ${STATUS_LABELS[status]}`}>
      <span
        className={
          status === "connected"
            ? "mr-1.5 h-2 w-2 rounded-full bg-green-300 inline-block"
            : status === "reconnecting" || status === "connecting"
            ? "mr-1.5 h-2 w-2 rounded-full bg-yellow-300 inline-block animate-pulse"
            : "mr-1.5 h-2 w-2 rounded-full bg-gray-400 inline-block"
        }
        aria-hidden
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
