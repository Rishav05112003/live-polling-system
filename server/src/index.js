// server/src/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Local imports MUST include the .js extension in ES Modules
import prisma from './config/db.js';
import registerPollHandlers from './sockets/pollHandlers.js';
import registerChatHandlers from './sockets/chatHandlers.js';
import registerRoomHandlers from './sockets/roomHandlers.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from Next.js (usually localhost:3000)
    methods: ["GET", "POST"]
  }
});

// Middleware to log connections
io.use((socket, next) => {
  console.log(`New connection attempt: ${socket.id}`);
  next();
});

// Main Socket Connection Logic
io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  // Initialize modular handlers
  registerRoomHandlers(io, socket);
  registerPollHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});