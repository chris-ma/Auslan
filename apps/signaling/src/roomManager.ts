const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface Room {
  peers: Set<string>;
  createdAt: number;
  lastActivityAt: number;
}

const rooms = new Map<string, Room>();

export function joinRoom(roomId: string, socketId: string): boolean {
  let room = rooms.get(roomId);

  if (!room) {
    room = { peers: new Set(), createdAt: Date.now(), lastActivityAt: Date.now() };
    rooms.set(roomId, room);
  }

  if (room.peers.size >= 2) return false;

  room.peers.add(socketId);
  room.lastActivityAt = Date.now();
  return true;
}

export function leaveRoom(roomId: string, socketId: string): string[] {
  const room = rooms.get(roomId);
  if (!room) return [];

  room.peers.delete(socketId);
  room.lastActivityAt = Date.now();

  const remaining = [...room.peers];

  if (room.peers.size === 0) {
    rooms.delete(roomId);
  }

  return remaining;
}

export function getPeers(roomId: string, excludeSocketId: string): string[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room.peers].filter((id) => id !== excludeSocketId);
}

export function getRoomForSocket(socketId: string): string | null {
  for (const [roomId, room] of rooms) {
    if (room.peers.has(socketId)) return roomId;
  }
  return null;
}

// Purge rooms inactive for more than ROOM_EXPIRY_MS
export function purgeExpiredRooms(): void {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_EXPIRY_MS) {
      rooms.delete(roomId);
    }
  }
}

// Run cleanup every hour
setInterval(purgeExpiredRooms, 60 * 60 * 1000);
