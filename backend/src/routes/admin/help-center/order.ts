import prisma from "../../../lib/prisma.js";

export const getNextHelpCenterOrder = async () => {
  const highestOrder = await prisma.helpCenter.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrder?.order ?? -1) + 1;
};

export const isHelpCenterOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existing = await prisma.helpCenter.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
};
