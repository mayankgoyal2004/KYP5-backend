import prisma from "../../../lib/prisma.js";

export const getNextPricingOrder = async () => {
  const highest = await prisma.subscriptionPlan.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highest?.order ?? -1) + 1;
};

export const isPricingOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existing = await prisma.subscriptionPlan.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
};
