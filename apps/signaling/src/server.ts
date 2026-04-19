import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { registerEvents } from "./events";

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  registerEvents(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Signaling server listening on :${PORT}`);
});
