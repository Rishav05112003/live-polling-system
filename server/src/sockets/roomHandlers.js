import { addUser, getRoomMembers, removeStudent } from "../services/roomService.js";
import { GLOBAL_ROOM } from "../index.js";

export default function roomHandlers(io, socket, prisma) {

  socket.on("join_room", async ({ name, role }) => {

    const user = await addUser(prisma, name, role, GLOBAL_ROOM, socket.id);

    socket.join(GLOBAL_ROOM);

    const members = await getRoomMembers(prisma);
    io.to(GLOBAL_ROOM).emit("update_members", members);
  });

  socket.on("kick_student", async ({ studentId }) => {
    await removeStudent(prisma, studentId);

    io.to(GLOBAL_ROOM).emit("kicked", { id: studentId });

    const members = await getRoomMembers(prisma);
    io.to(GLOBAL_ROOM).emit("update_members", members);
  });
}
