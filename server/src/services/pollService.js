import { roomPollMap, activePolls } from "../index.js";

export async function createPoll(prisma, roomId, question, options, timer) {
  const poll = await prisma.poll.create({
    data: {
      question,
      timer,
      status: "ACTIVE",
      roomId,
      startedAt: new Date(),
      options: {
        create: options.map(o => ({
          text: o,
        }))
      }
    },
    include: { options: true }
  });

  roomPollMap.set(roomId, poll);
  return poll;
}

export async function endPoll(prisma, io, roomId) {
  const poll = roomPollMap.get(roomId);
  if (!poll) return;

  await prisma.poll.update({
    where: { id: poll.id },
    data: { status: "ENDED" }
  });

  clearTimeout(activePolls.get(poll.id));
  activePolls.delete(poll.id);

  io.to(roomId).emit("poll_ended");
  roomPollMap.delete(roomId);
}
