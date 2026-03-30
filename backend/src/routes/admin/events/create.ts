import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";

/**
 * POST /api/admin/events
 * Create an event
 */
export const createEvent = catchAsync(async (req: Request, res: Response) => {
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

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      thumbnail: thumbnail || null,
      eventDate: new Date(eventDate),
      eventTime: eventTime || null,
      venue: venue || null,
      buttonText: buttonText || "Get Ticket",
      buttonLink: buttonLink || null,
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res
    .status(201)
    .json(ApiResponse.created(event, "Event created successfully"));
});
