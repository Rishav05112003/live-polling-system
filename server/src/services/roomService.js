export async function addUser(prisma, name, role, roomId, socketId) {
  return prisma.user.create({
    data: { name, role, roomId, socketId }
  });
}

export async function getRoomMembers(prisma, roomId) {
  return prisma.user.findMany({
    where: { roomId },
    select: { id: true, name: true, role: true }
  });
}

export async function removeStudent(prisma, userId) {
  return prisma.user.delete({ where: { id: userId } });
}
