// src/sockets/roomHandlers.js
import prisma from '../config/db.js'; // Note the .js extension

const registerRoomHandlers = (io, socket) => {

  // 1. Join Room
  socket.on('join_room', async ({ name, role, roomId }) => {
    try {
      socket.join(roomId);
      console.log(`User ${name} (${role}) joined room: ${roomId}`);

      // Check if user exists, or create new one
      let user = await prisma.user.findFirst({
        where: { name, role } 
      });

      if (!user) {
        user = await prisma.user.create({
          data: { name, role, socketId: socket.id }
        });
      } else {
        // Update socket ID for reconnection
        user = await prisma.user.update({
          where: { id: user.id },
          data: { socketId: socket.id }
        });
      }

      // Send active poll state to the new user (Resilience)
      const activePoll = await prisma.poll.findFirst({
        where: { status: 'ACTIVE' },
        include: { options: true, votes: true }
      });

      if (activePoll) {
        const now = new Date();
        const elapsed = Math.floor((now - new Date(activePoll.startedAt)) / 1000);
        const remainingTime = activePoll.timer - elapsed;

        if (remainingTime > 0) {
          socket.emit('sync_poll_state', {
             ...activePoll,
             remainingTime
          });
        }
      }

      // Notify room of new member list
      // Note: In a real app, you should filter by room, but for now we fetch all
      const members = await prisma.user.findMany(); 
      io.to(roomId).emit('update_members', members);

    } catch (error) {
      console.error("Join Error:", error);
    }
  });

  // 2. Kick Member
  socket.on('kick_student', async ({ studentId, roomId }) => {
    try {
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (student && student.socketId) {
        io.to(student.socketId).emit('kicked'); 
        io.sockets.sockets.get(student.socketId)?.disconnect(true);

        await prisma.user.delete({ where: { id: studentId } });
        
        const members = await prisma.user.findMany();
        io.to(roomId).emit('update_members', members);
      }
    } catch (error) {
      console.error("Kick Error:", error);
    }
  });
};

export default registerRoomHandlers;