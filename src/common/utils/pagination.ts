export function resolvePagination(query: {
  page?: number;
  perPage?: number;
}) {
  const page = Number(query.page) || 1;
  const perPage = Math.min(Number(query.perPage) || 20, 100);
  const skip = (page - 1) * perPage;
  return { page, perPage, skip };
}

export function buildPaginationMeta(
  page: number,
  perPage: number,
  total: number,
) {
  return {
    page,
    perPage,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
  };
}
