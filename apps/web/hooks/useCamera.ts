"use client";

import { useCallback, useEffect } from "react";
import { useCameraStore } from "@/store/cameraStore";

export function useCamera() {
  const {
    stream,
    devices,
    activeDeviceId,
    permission,
    status,
    errorMessage,
    setStream,
    setDevices,
    setActiveDeviceId,
    setPermission,
    setStatus,
    setError,
    reset,
  } = useCameraStore();

  const enumerateDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cameras = all.filter((d) => d.kind === "videoinput");
      setDevices(cameras);
    } catch {
      // enumeration requires permission; silently ignore
    }
  }, [setDevices]);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setStatus("starting");
      setError(null);

      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setPermission("granted");
        setStatus("active");

        const videoTrack = newStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        if (settings?.deviceId) {
          setActiveDeviceId(settings.deviceId);
        }

        await enumerateDevices();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setPermission("denied");
          setError("Camera permission denied. Please allow camera access and refresh.");
        } else if (msg.includes("NotFound")) {
          setError("No camera found on this device.");
        } else {
          setError(`Camera error: ${msg}`);
        }
        setStatus("error");
      }
    },
    [setStream, setPermission, setStatus, setError, setActiveDeviceId, enumerateDevices]
  );

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    reset();
  }, [stream, reset]);

  const switchCamera = useCallback(
    async (deviceId: string) => {
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      await startCamera(deviceId);
    },
    [stream, setStream, startCamera]
  );

  useEffect(() => {
    const handleDeviceChange = () => enumerateDevices();
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () =>
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
  }, [enumerateDevices]);

  return {
    stream,
    devices,
    activeDeviceId,
    permission,
    status,
    errorMessage,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
