import { z } from 'zod';
import { PAGINATION } from '../config/constants';

// Query fields shared by every paginated list: ?page=1&pageSize=10&order=desc
// Spread them into a list's query schema: z.strictObject({ ...paginationQuery, sortBy: ... })
export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION.maxPageSize).default(PAGINATION.defaultPageSize),
  order: z.enum(['asc', 'desc']).default('desc'),
};

// Converts page/pageSize into Prisma's skip/take
export function toSkipTake(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// The shape every paginated list returns
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, pageSize };
}

// Response schema for the API docs: wraps an item schema in { items, total, page, pageSize }
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });
}
