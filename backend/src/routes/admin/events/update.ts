import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/events/:id
 * Update an event
 */
export const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const {
    title,
    description,
    thumbnail,
    eventDate,
    eventTime,
    venue,
    buttonText,
    buttonLink,
    order,
    isActive,
  } = req.body;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.isDeleted)
    throw ApiError.notFound("Event not found");

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: title || undefined,
      description: description !== undefined ? description : undefined,
      thumbnail: thumbnail !== undefined ? thumbnail : undefined,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventTime: eventTime !== undefined ? eventTime : undefined,
      venue: venue !== undefined ? venue : undefined,
      buttonText: buttonText !== undefined ? buttonText : undefined,
      buttonLink: buttonLink !== undefined ? buttonLink : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  res.json(ApiResponse.success(event, "Event updated successfully"));
});
