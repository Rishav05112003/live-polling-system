import { addUser, getRoomMembers, removeStudent } from "../services/roomService.js";

export default function roomHandlers(io, socket, prisma) {

  socket.on("join_room", async ({ name, role, roomId }) => {
    const user = await addUser(prisma, name, role, roomId, socket.id);
    socket.join(roomId);

    const members = await getRoomMembers(prisma, roomId);
    io.to(roomId).emit("update_members", members);
  });

  socket.on("kick_student", async ({ studentId, roomId }) => {
    await removeStudent(prisma, studentId);
    io.to(roomId).emit("kicked", { id: studentId });

    const members = await getRoomMembers(prisma, roomId);
    io.to(roomId).emit("update_members", members);
  });
}
