import { z } from "zod";

// Common pagination query schema
export const paginationSchema = z.object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default("10").transform(Number),
    search: z.string().optional(),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Common ID param schema
export const idParamSchema = z.object({
    id: z.string().transform(Number),
});

export const uuidParamSchema = z.object({
    id: z.string().uuid(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Build pagination response
 */
export function buildPaginationResponse(total: number, page: number, limit: number) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
    };
}
