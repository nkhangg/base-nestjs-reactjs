import type { PaginateQuery } from 'nestjs-paginate';

export interface PaginateConfig {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface ParsedPage {
  page: number;
  limit: number;
  search: string | undefined;
  filter: Record<string, string | string[]>;
  sortBy: [string, string] | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy: [string, string][];
    search: string;
    filter: Record<string, string | string[]>;
  };
  links: {
    first: string;
    previous?: string;
    current: string;
    next?: string;
    last: string;
  };
}

export function parsePage(
  query: PaginateQuery,
  config: PaginateConfig = {},
): ParsedPage {
  const defaultLimit = config.defaultLimit ?? 20;
  const maxLimit = config.maxLimit ?? 100;
  const limit = Math.min(Math.max(query.limit ?? defaultLimit, 1), maxLimit);
  const page = Math.max(query.page ?? 1, 1);

  return {
    page,
    limit,
    search: query.search,
    filter: query.filter ?? {},
    sortBy: query.sortBy?.[0] as [string, string] | undefined,
  };
}

/** Lấy giá trị string đầu tiên từ filter field. */
export function filterStr(
  filter: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const v = filter[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Parse "true"/"false" → boolean. */
export function filterBool(
  filter: Record<string, string | string[]>,
  key: string,
): boolean | undefined {
  const v = filterStr(filter, key);
  return v === 'true' ? true : v === 'false' ? false : undefined;
}

/** Parse nestjs-paginate $gte/$lte date operators → Date range. */
export function filterDateRange(
  filter: Record<string, string | string[]>,
  key: string,
): { from?: Date; to?: Date } {
  const raw = filter[key];
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  let from: Date | undefined;
  let to: Date | undefined;
  for (const v of arr) {
    if (v.startsWith('$gte:')) {
      const d = new Date(v.slice(5));
      if (!isNaN(d.getTime())) from = d;
    } else if (v.startsWith('$lte:')) {
      const d = new Date(v.slice(5));
      if (!isNaN(d.getTime())) to = d;
    }
  }
  return { from, to };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  query: PaginateQuery,
  config: PaginateConfig = {},
): PaginatedResponse<T> {
  const defaultLimit = config.defaultLimit ?? 20;
  const maxLimit = config.maxLimit ?? 100;
  const limit = Math.min(Math.max(query.limit ?? defaultLimit, 1), maxLimit);
  const page = Math.max(query.page ?? 1, 1);
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const buildUrl = (p: number) => `${query.path}?page=${p}&limit=${limit}`;

  return {
    data,
    meta: {
      itemsPerPage: limit,
      totalItems: total,
      currentPage: page,
      totalPages,
      sortBy: (query.sortBy ?? []) as [string, string][],
      search: query.search ?? '',
      filter: query.filter ?? {},
    },
    links: {
      first: buildUrl(1),
      previous: page > 1 ? buildUrl(page - 1) : undefined,
      current: buildUrl(page),
      next: page < totalPages ? buildUrl(page + 1) : undefined,
      last: buildUrl(totalPages),
    },
  };
}
