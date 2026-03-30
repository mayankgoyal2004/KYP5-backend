import prisma from "../../../lib/prisma.js";

export const getNextCourseCategoryOrder = async () => {
  const highestOrderCategory = await prisma.courseCategory.findFirst({
    where: { isDeleted: false },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (highestOrderCategory?.order ?? -1) + 1;
};

export const isCourseCategoryOrderTaken = async (
  order: number,
  excludeId?: string,
) => {
  const existingCategory = await prisma.courseCategory.findFirst({
    where: {
      isDeleted: false,
      order,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingCategory);
};
