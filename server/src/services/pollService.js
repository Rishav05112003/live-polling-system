import { activePoll, activeTimeout, GLOBAL_ROOM } from "../index.js";

export async function createPoll(prisma, question, options, timer) {
  const poll = await prisma.poll.create({
    data: {
      question,
      timer,
      status: "ACTIVE",
      startedAt: new Date(),
      options: {
        create: options.map(o => ({ text: o }))
      }
    },
    include: { options: true }
  });

  activePoll.current = poll;
  return poll;
}

export async function endPoll(prisma, io) {
  const poll = activePoll.current;
  if (!poll) return;

  await prisma.poll.update({
    where: { id: poll.id },
    data: { status: "ENDED" }
  });

  clearTimeout(activeTimeout.current);

  io.to(GLOBAL_ROOM).emit("poll_ended");
  activePoll.current = null;
}
