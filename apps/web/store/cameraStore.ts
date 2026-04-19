import { create } from "zustand";

export type CameraPermission = "unknown" | "granted" | "denied" | "prompt";
export type CameraStatus = "idle" | "starting" | "active" | "error";

interface CameraState {
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  permission: CameraPermission;
  status: CameraStatus;
  errorMessage: string | null;

  setStream: (stream: MediaStream | null) => void;
  setDevices: (devices: MediaDeviceInfo[]) => void;
  setActiveDeviceId: (id: string | null) => void;
  setPermission: (p: CameraPermission) => void;
  setStatus: (s: CameraStatus) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  stream: null,
  devices: [],
  activeDeviceId: null,
  permission: "unknown",
  status: "idle",
  errorMessage: null,

  setStream: (stream) => set({ stream }),
  setDevices: (devices) => set({ devices }),
  setActiveDeviceId: (id) => set({ activeDeviceId: id }),
  setPermission: (permission) => set({ permission }),
  setStatus: (status) => set({ status }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () =>
    set({
      stream: null,
      status: "idle",
      errorMessage: null,
    }),
}));
