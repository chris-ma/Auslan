import { io, type Socket } from "socket.io-client";

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL ?? "http://localhost:3001";

export interface SubtitleMessage {
  type: "subtitle";
  label: string;
  displayText: string;
  confidence: number;
  timestamp: number;
  sequenceId: number;
}

type SignalingEventMap = {
  "peer-joined": () => void;
  offer: (sdp: RTCSessionDescriptionInit) => void;
  answer: (sdp: RTCSessionDescriptionInit) => void;
  "ice-candidate": (candidate: RTCIceCandidateInit) => void;
  "peer-left": () => void;
};

class SignalingClient {
  private socket: Socket | null = null;
  private handlers: Partial<SignalingEventMap> = {};

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SIGNALING_URL, { transports: ["websocket", "polling"] });

      this.socket.once("connect", () => resolve());
      this.socket.once("connect_error", (err) => reject(err));

      this.socket.on("peer-joined", () => this.handlers["peer-joined"]?.());
      this.socket.on("offer", (sdp) => this.handlers["offer"]?.(sdp));
      this.socket.on("answer", (sdp) => this.handlers["answer"]?.(sdp));
      this.socket.on("ice-candidate", (c) =>
        this.handlers["ice-candidate"]?.(c)
      );
      this.socket.on("peer-left", () => this.handlers["peer-left"]?.());
    });
  }

  joinRoom(roomId: string): void {
    this.socket?.emit("join-room", roomId);
  }

  sendOffer(roomId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit("offer", { roomId, sdp });
  }

  sendAnswer(roomId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit("answer", { roomId, sdp });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit("ice-candidate", { roomId, candidate });
  }

  on<K extends keyof SignalingEventMap>(event: K, handler: SignalingEventMap[K]): void {
    this.handlers[event] = handler;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.handlers = {};
  }
}

export const signalingClient = new SignalingClient();
