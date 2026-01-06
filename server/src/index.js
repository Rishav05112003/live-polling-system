import express from "express";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import roomHandlers from "./sockets/roomHandlers.js";
import pollHandlers from "./sockets/pollHandlers.js";
import chatHandlers from "./sockets/chatHandlers.js";
import { getRoomMembers } from "./services/roomService.js";


const prisma = new PrismaClient();
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

export const activePolls = new Map();  // pollId → timeout
export const roomPollMap = new Map();  // roomId → poll

export const GLOBAL_ROOM = "GLOBAL_ROOM";
export const activePoll = { current: null };
export const activeTimeout = { current: null };


io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  roomHandlers(io, socket, prisma);
  pollHandlers(io, socket, prisma);
  chatHandlers(io, socket, prisma);

  socket.on("disconnect", async () => {
    await prisma.user.deleteMany({
      where: { socketId: socket.id }
    });

    const members = await getRoomMembers(prisma);
    io.to("GLOBAL_ROOM").emit("update_members", members);
  });
});

app.get("/", (req, res) => res.send("Polling System Running"));


server.listen(5000, () => console.log("Server running on 5000"));
