import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { validate } from "../../../middleware/validate.js";
import { createContactSchema } from "../../../schemas/public/contact.js";

const router = Router();

router.post(
  "/",
  validate(createContactSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;

    const contact = await prisma.contactMessage.create({
      data: { name, email, subject, message }
    });

    res.status(201).json(ApiResponse.success(contact, "Message sent successfully"));
  })
);

export default router;
