import type { Server, Socket } from "socket.io";
import {
  joinRoom,
  leaveRoom,
  getPeers,
  getRoomForSocket,
} from "./roomManager";

export function registerEvents(io: Server, socket: Socket): void {
  socket.on(
    "join-room",
    (roomId: string) => {
      if (typeof roomId !== "string" || !/^[0-9a-f]{32}$/i.test(roomId)) {
        socket.emit("error", "Invalid room ID");
        return;
      }

      const joined = joinRoom(roomId, socket.id);
      if (!joined) {
        socket.emit("error", "Room is full");
        return;
      }

      socket.join(roomId);

      // Notify existing peers that someone joined
      const peers = getPeers(roomId, socket.id);
      for (const peerId of peers) {
        io.to(peerId).emit("peer-joined");
      }
    }
  );

  socket.on(
    "offer",
    ({ roomId, sdp }: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      const peers = getPeers(roomId, socket.id);
      for (const peerId of peers) {
        io.to(peerId).emit("offer", sdp);
      }
    }
  );

  socket.on(
    "answer",
    ({ roomId, sdp }: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      const peers = getPeers(roomId, socket.id);
      for (const peerId of peers) {
        io.to(peerId).emit("answer", sdp);
      }
    }
  );

  socket.on(
    "ice-candidate",
    ({
      roomId,
      candidate,
    }: {
      roomId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const peers = getPeers(roomId, socket.id);
      for (const peerId of peers) {
        io.to(peerId).emit("ice-candidate", candidate);
      }
    }
  );

  socket.on("disconnect", () => {
    const roomId = getRoomForSocket(socket.id);
    if (!roomId) return;

    const remaining = leaveRoom(roomId, socket.id);
    for (const peerId of remaining) {
      io.to(peerId).emit("peer-left");
    }
  });
}
