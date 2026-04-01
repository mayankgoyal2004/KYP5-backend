import prisma from "./prisma.js";
import { ApiError } from "../utils/ApiError.js";

export type RecycleEntityType =
  | "course"
  | "test"
  | "question"
  | "blog"
  | "blog_category"
  | "testimonial"
  | "user"
  | "course_category"
  | "gallery"
  | "event";

interface ArchiveInput {
  module: string;
  entityType: RecycleEntityType;
  recordId: string;
  recordLabel?: string | null;
  payload: unknown;
  deletedById?: string;
}

export async function archiveToRecycleBin(input: ArchiveInput) {
  return prisma.recycleBinEntry.create({
    data: {
      module: input.module,
      entityType: input.entityType,
      recordId: input.recordId,
      recordLabel: input.recordLabel ?? null,
      payload: input.payload as any,
      deletedById: input.deletedById,
    },
  });
}

function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

function omitSystemFields<T extends Record<string, any>>(obj: T) {
  return omit(obj, ["id", "createdAt", "updatedAt", "_count"] as (keyof T)[]);
}

function ensureObject(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ApiError.badRequest(`Invalid recycle payload for ${label}`);
  }
  return value as Record<string, any>;
}

// ─── Restore functions for each entity type ──────────────

async function restoreCourse(payload: unknown) {
  const data = ensureObject(payload, "course");
  const existing = await prisma.course.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.course.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.course.create({
      data: omit(data, ["_count", "test"]) as any,
    });
  }
}

async function restoreTest(payload: unknown) {
  const data = ensureObject(payload, "test");
  const existing = await prisma.test.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.test.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.test.create({
      data: omit(data, ["_count", "questions", "course", "testAttempts", "testLanguages"]) as any,
    });
  }
}

async function restoreQuestion(payload: unknown) {
  const questionData = ensureObject(payload, "question");
  const options = Array.isArray(questionData.options) ? questionData.options : [];

  const existing = await prisma.question.findUnique({
    where: { id: questionData.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.question.update({
      where: { id: questionData.id as string },
      data: { isDeleted: false },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.question.create({
        data: omit(questionData, ["options", "translations", "userAnswers", "_count"]) as any,
      });

      if (options.length > 0) {
        await tx.option.createMany({
          data: options.map((opt: any) =>
            omit(opt, ["translations", "userAnswers"]),
          ) as any[],
          skipDuplicates: true,
        });
      }
    });
  }
}

async function restoreBlog(payload: unknown) {
  const data = ensureObject(payload, "blog");

  const existing = await prisma.blog.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.blog.update({
      where: { id: data.id as string },
      data: { isDeleted: false },
    });
  } else {
    await prisma.blog.create({
      data: omit(data, ["_count", "category"]) as any,
    });
  }
}

async function restoreBlogCategory(payload: unknown) {
  const data = ensureObject(payload, "blog_category");

  const existing = await prisma.blogCategory.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.blogCategory.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.blogCategory.create({
      data: omit(data, ["_count", "blogs"]) as any,
    });
  }
}

async function restoreTestimonial(payload: unknown) {
  const data = ensureObject(payload, "testimonial");

  const existing = await prisma.testimonial.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    // Testimonials don't have isDeleted, just recreate
    return;
  } else {
    await prisma.testimonial.create({
      data: omit(data, ["_count"]) as any,
    });
  }
}

async function restoreUser(payload: unknown) {
  const data = ensureObject(payload, "user");
  const existing = await prisma.user.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.user.create({
      data: omit(data, [
        "_count",
        "role",
        "testAttempts",
        "contactMessages",
        "permissions",
      ]) as any,
    });
  }
}

async function restoreCourseCategory(payload: unknown) {
  const data = ensureObject(payload, "course_category");
  const existing = await prisma.courseCategory.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.courseCategory.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.courseCategory.create({
      data: omit(data, ["_count", "courses"]) as any,
    });
  }
}

async function restoreGallery(payload: unknown) {
  const data = ensureObject(payload, "gallery");
  const existing = await prisma.gallery.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.gallery.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    await prisma.gallery.create({
      data: omit(data, ["_count"]) as any,
    });
  }
}

async function restoreEvent(payload: unknown) {
  const data = ensureObject(payload, "event");
  const existing = await prisma.event.findUnique({
    where: { id: data.id as string },
    select: { id: true },
  });

  if (existing) {
    await prisma.event.update({
      where: { id: data.id as string },
      data: { isDeleted: false, isActive: true },
    });
  } else {
    // Reconstruct eventDate since it will be stringified in the payload JSON
    const eventData = omit(data, ["_count"]) as any;
    if (eventData.eventDate) eventData.eventDate = new Date(eventData.eventDate);
    
    await prisma.event.create({
      data: eventData,
    });
  }
}

// ─── Main restore dispatcher ────────────────────────────

export async function restoreRecycleBinEntry(entry: {
  id: string;
  entityType: string;
  payload: unknown;
}) {
  switch (entry.entityType as RecycleEntityType) {
    case "course":
      await restoreCourse(entry.payload);
      break;
    case "test":
      await restoreTest(entry.payload);
      break;
    case "question":
      await restoreQuestion(entry.payload);
      break;
    case "blog":
      await restoreBlog(entry.payload);
      break;
    case "blog_category":
      await restoreBlogCategory(entry.payload);
      break;
    case "testimonial":
      await restoreTestimonial(entry.payload);
      break;
    case "user":
      await restoreUser(entry.payload);
      break;
    case "course_category":
      await restoreCourseCategory(entry.payload);
      break;
    case "gallery":
      await restoreGallery(entry.payload);
      break;
    case "event":
      await restoreEvent(entry.payload);
      break;
    default:
      throw ApiError.badRequest(
        `Restore not supported for entity type: ${entry.entityType}`,
      );
  }
}

// ─── Permanent delete ───────────────────────────────────

export async function permanentlyDeleteRecycledRecord(entry: {
  entityType: string;
  recordId: string;
}) {
  switch (entry.entityType as RecycleEntityType) {
    case "course":
      await prisma.course.deleteMany({ where: { id: entry.recordId } });
      break;
    case "test":
      await prisma.test.deleteMany({ where: { id: entry.recordId } });
      break;
    case "question":
      await prisma.question.deleteMany({ where: { id: entry.recordId } });
      break;
    case "blog":
      await prisma.blog.deleteMany({ where: { id: entry.recordId } });
      break;
    case "blog_category":
      await prisma.blogCategory.deleteMany({ where: { id: entry.recordId } });
      break;
    case "testimonial":
      await prisma.testimonial.deleteMany({ where: { id: entry.recordId } });
      break;
    case "user":
      await prisma.user.deleteMany({ where: { id: entry.recordId } });
      break;
    case "course_category":
      await prisma.courseCategory.deleteMany({ where: { id: entry.recordId } });
      break;
    case "gallery":
      await prisma.gallery.deleteMany({ where: { id: entry.recordId } });
      break;
    case "event":
      await prisma.event.deleteMany({ where: { id: entry.recordId } });
      break;
    default:
      break;
  }
}