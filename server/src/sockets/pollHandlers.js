import { createPoll, endPoll } from "../services/pollService.js";
import { submitVote, hasVoted, calculateResults } from "../services/voteService.js";
import { roomPollMap, activePolls } from "../index.js";

export default function pollHandlers(io, socket, prisma) {

  socket.on("create_poll", async ({ question, options, timer, roomId }) => {
    const poll = await createPoll(prisma, roomId, question, options, timer);

    io.to(roomId).emit("new_poll", {
      ...poll,
      options: poll.options,
      timer
    });

    const timeout = setTimeout(() => {
      endPoll(prisma, io, roomId);
    }, timer * 1000);

    activePolls.set(poll.id, timeout);
  });


  socket.on("submit_vote", async ({ pollId, optionId, roomId }) => {
    const user = await prisma.user.findFirst({
      where: { socketId: socket.id }
    });

    if (!user) return;

    const already = await hasVoted(prisma, pollId, user.id);
    if (already) return;

    await submitVote(prisma, pollId, user.id, optionId);

    const results = await calculateResults(prisma, pollId);
    io.to(roomId).emit("update_results", results);
  });


  socket.on("sync_state", async ({ roomId }) => {
    const poll = roomPollMap.get(roomId);
    if (!poll) return;

    const elapsed = (Date.now() - new Date(poll.startedAt)) / 1000;
    const remaining = poll.timer - Math.floor(elapsed);

    io.to(socket.id).emit("sync_poll_state", {
      ...poll,
      remainingTime: remaining > 0 ? remaining : 0
    });
  });
}
