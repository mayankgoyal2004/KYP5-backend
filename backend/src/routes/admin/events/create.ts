import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextEventOrder, isEventOrderTaken } from "./order.js";

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
  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextEventOrder()
      : Number(order);

  if (await isEventOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another event`,
    );
  }

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
      order: parsedOrder,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res
    .status(201)
    .json(ApiResponse.created(event, "Event created successfully"));
});
