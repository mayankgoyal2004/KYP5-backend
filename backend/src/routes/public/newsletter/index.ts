import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { validate } from "../../../middleware/validate.js";
import { createNewsletterSubscriberSchema } from "../../../schemas/public/newsletter.js";

const router = Router();
const prismaClient = prisma as any;

router.post(
  "/",
  validate(createNewsletterSubscriberSchema),
  catchAsync(async (req: Request, res: Response) => {
    const email = req.body.email.trim().toLowerCase();
    const name = req.body.name?.trim() || null;
    const source = req.body.source?.trim() || "website";

    const existing = await prismaClient.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      const subscriber = await prismaClient.newsletterSubscriber.update({
        where: { email },
        data: {
          name,
          source,
          status: "SUBSCRIBED",
          unsubscribedAt: null,
        },
      });

      return res.json(
        ApiResponse.success(
          subscriber,
          "You are already on the newsletter list. Your subscription has been refreshed.",
        ),
      );
    }

    const subscriber = await prismaClient.newsletterSubscriber.create({
      data: {
        email,
        name,
        source,
      },
    });

    return res
      .status(201)
      .json(
        ApiResponse.created(
          subscriber,
          "Subscribed to newsletter successfully",
        ),
      );
  }),
);

export default router;
