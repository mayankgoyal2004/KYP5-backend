/**
 * Generate a sequential ticket/code number
 */
export function generateCode(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Build pagination response metadata
 */
export function buildPagination(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
}

/**
 * Parse pagination from query params
 */
export function parsePagination(query: any): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit as string) || 20),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
/**
 * Get client IP from request
 */
export function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
