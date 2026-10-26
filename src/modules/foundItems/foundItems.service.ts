import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { conflict, notFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import { FoundItemStatus, OwnershipRequestStatus, Role } from '../../config/constants';
import { lookupInclude } from '../lookups/lookups.mapper';
import { assertLookupsExist } from '../lookups/lookups.service';
import { toAdminFoundItem, toFoundItemDto } from './foundItems.mapper';
import { FoundItemInput, FoundItemListQuery } from './foundItems.schemas';
import { CurrentUser } from '../../types/currentUser';

export async function list(user: CurrentUser, query: FoundItemListQuery) {
  const where: Prisma.FoundItemWhereInput = {
    categoryId: query.categoryId,
    colorId: query.colorId,
    locationId: query.locationId,
    // Regular users only ever see items that are still available
    status: user.role === Role.Admin ? query.status : FoundItemStatus.Available,
  };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.foundItem.findMany({
      where,
      include: lookupInclude,
      orderBy: [{ [query.sortBy]: query.order }, { id: query.order }],
      ...toSkipTake(query.page, query.pageSize),
    }),
    prisma.foundItem.count({ where }),
  ]);

  const items = rows.map((row) => toFoundItemDto(row, user.role));
  return paginated(items, total, query.page, query.pageSize);
}

export async function getById(user: CurrentUser, id: number) {
  const item = await prisma.foundItem.findUnique({ where: { id }, include: lookupInclude });
  if (!item) throw notFound('Found item');
  return toFoundItemDto(item, user.role);
}

// ----- Admin only (enforced by requireRole in the routes) -----

export async function create(input: FoundItemInput) {
  await assertLookupsExist(input);
  const item = await prisma.foundItem.create({ data: input, include: lookupInclude });
  return toAdminFoundItem(item);
}

export async function update(id: number, input: FoundItemInput) {
  const existing = await prisma.foundItem.findUnique({ where: { id } });
  if (!existing) throw notFound('Found item');

  await assertLookupsExist(input);
  const item = await prisma.foundItem.update({ where: { id }, data: input, include: lookupInclude });
  return toAdminFoundItem(item);
}

export async function remove(id: number) {
  const existing = await prisma.foundItem.findUnique({ where: { id } });
  if (!existing) throw notFound('Found item');
  if (existing.status === FoundItemStatus.Returned) {
    throw conflict('A returned item cannot be deleted');
  }
  const pending = await prisma.ownershipRequest.count({
    where: { foundItemId: id, status: OwnershipRequestStatus.Pending },
  });
  if (pending > 0) {
    throw conflict('An item with pending ownership requests cannot be deleted');
  }

  // Delete the item together with its (rejected) ownership requests
  await prisma.$transaction([
    prisma.ownershipRequest.deleteMany({ where: { foundItemId: id } }),
    prisma.foundItem.delete({ where: { id } }),
  ]);
}
