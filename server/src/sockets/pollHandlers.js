import { createPoll, endPoll } from "../services/pollService.js";
import { submitVote, hasVoted, calculateResults } from "../services/voteService.js";
import { GLOBAL_ROOM, activePoll, activeTimeout } from "../index.js";

export default function pollHandlers(io, socket, prisma) {

  socket.on("create_poll", async ({ question, options, timer }) => {

    const poll = await createPoll(prisma, question, options, timer);
    activePoll.current = poll;

    // Broadcast poll to everyone
    io.to(GLOBAL_ROOM).emit("new_poll", {
      ...poll,
      options: poll.options,
      timer
    });

    // Auto end poll
    activeTimeout.current = setTimeout(() => {
      endPoll(prisma, io);
    }, timer * 1000);
  });


  socket.on("submit_vote", async ({ pollId, optionId }) => {

    const user = await prisma.user.findFirst({
      where: { socketId: socket.id }
    });

    if (!user) return;

    // Prevent double voting
    if (await hasVoted(prisma, pollId, user.id)) return;

    // Save vote
    await submitVote(prisma, pollId, user.id, optionId);

    // Calculate live results
    const results = await calculateResults(prisma, pollId);

    // SEND RESULTS **ONLY TO TEACHERS**
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" }
    });

    teachers.forEach(t => {
      if (t.socketId) {
        io.to(t.socketId).emit("update_results", results);
      }
    });
  });


  socket.on("sync_state", async () => {
    if (!activePoll.current) return;

    const poll = activePoll.current;

    const elapsed = (Date.now() - new Date(poll.startedAt)) / 1000;
    const remaining = poll.timer - Math.floor(elapsed);

    io.to(socket.id).emit("sync_poll_state", {
      ...poll,
      remainingTime: remaining > 0 ? remaining : 0
    });
  });

}
