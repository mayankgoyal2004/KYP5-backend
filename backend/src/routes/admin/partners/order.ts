import { prisma } from "../../../lib/prisma.js";

export const getNextPartnerOrder = async () => {
  const highestOrderPartner = await prisma.partner.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderPartner?.order ?? -1) + 1;
};

export const isPartnerOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existingPartner = await prisma.partner.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingPartner);
};
