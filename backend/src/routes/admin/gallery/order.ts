import prisma from "../../../lib/prisma.js";

export const getNextGalleryOrder = async () => {
  const highestOrderImage = await prisma.gallery.findFirst({
    where: { isDeleted: false },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderImage?.order ?? -1) + 1;
};

export const isGalleryOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existingImage = await prisma.gallery.findFirst({
    where: {
      isDeleted: false,
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingImage);
};
