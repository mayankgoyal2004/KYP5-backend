import { prisma } from "../../../lib/prisma.js";

export const getNextTeamOrder = async () => {
  const highestOrderTeam = await prisma.team.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderTeam?.order ?? -1) + 1;
};

export const isTeamOrderTaken = async (order: number, excludeId?: string) => {
  const existingTeam = await prisma.team.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingTeam);
};
