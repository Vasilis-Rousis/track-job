export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(query: PaginationQuery): PaginationResult {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
