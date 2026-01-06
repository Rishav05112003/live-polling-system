export async function submitVote(prisma, pollId, userId, optionId) {
  return prisma.vote.create({
    data: { pollId, userId, optionId }
  });
}

export async function hasVoted(prisma, pollId, userId) {
  const vote = await prisma.vote.findFirst({
    where: { pollId, userId }
  });
  return !!vote;
}

export async function calculateResults(prisma, pollId) {
  const options = await prisma.option.findMany({
    where: { pollId },
    include: { votes: true }
  });

  const totalVotes = options.reduce((sum, o) => sum + o.votes.length, 0);

  return options.map(o => ({
    optionId: o.id,
    votes: o.votes.length,
    percentage: totalVotes === 0 ? 0 : (o.votes.length / totalVotes) * 100
  }));
}
