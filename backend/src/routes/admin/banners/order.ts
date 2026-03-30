import prisma from "../../../lib/prisma.js";

export const getNextBannerOrder = async () => {
  const highestOrderBanner = await prisma.banner.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderBanner?.order ?? -1) + 1;
};

export const isBannerOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existingBanner = await prisma.banner.findFirst({
    where: {
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingBanner);
};
