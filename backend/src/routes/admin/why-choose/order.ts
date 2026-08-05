import prisma from "../../../lib/prisma.js";

export const getNextWhyChooseOrder = async () => {
  const highest = await prisma.whyChooseCard.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highest?.order ?? -1) + 1;
};

export const isWhyChooseOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existing = await prisma.whyChooseCard.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
};
