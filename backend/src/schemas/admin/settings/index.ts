import { z } from "zod";

export const createSettingSchema = z.object({
    key: z.string().min(1, "Setting key is required"),
    value: z.string().min(1, "Setting value is required"),
    description: z.string().optional(),
});

export const updateSettingSchema = z.object({
    value: z.string().min(1, "Setting value is required"),
    description: z.string().optional(),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
