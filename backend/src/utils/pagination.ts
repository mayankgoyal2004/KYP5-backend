import { z } from "zod";

export const paginationSchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform(v => (v ? parseInt(v) : 10)),
  search: z.string().optional(),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});

export function getPaginationData(query: any) {
  const parsed = paginationSchema.parse(query);
  const skip = (parsed.page - 1) * parsed.limit;
  const take = parsed.limit;
  
  return {
    skip,
    take,
    page: parsed.page,
    limit: parsed.limit,
    search: parsed.search,
    orderBy: { [parsed.sortBy]: parsed.sortOrder }
  };
}

export function formatPaginatedResponse(data: any[], count: number, page: number, limit: number) {
  return {
    data,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}
