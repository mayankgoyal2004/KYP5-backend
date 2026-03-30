import prisma from "../../../lib/prisma.js";

export const getNextEventOrder = async () => {
  const highestOrderEvent = await prisma.event.findFirst({
    where: { isDeleted: false },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderEvent?.order ?? -1) + 1;
};

export const isEventOrderTaken = async (order: number, excludeId?: string) => {
  const existingEvent = await prisma.event.findFirst({
    where: {
      isDeleted: false,
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingEvent);
};
