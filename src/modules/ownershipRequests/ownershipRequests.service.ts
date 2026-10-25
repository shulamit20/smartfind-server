import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { conflict, notFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import {
  AUTO_REJECT_REASON,
  FoundItemStatus,
  LostReportStatus,
  OwnershipRequestStatus,
  Role,
} from '../../config/constants';
import { CurrentUser } from '../../types/currentUser';
import { ownershipRequestInclude, toOwnershipRequestDto } from './ownershipRequests.mapper';
import { CreateOwnershipRequestInput, OwnershipRequestListQuery } from './ownershipRequests.schemas';

// Admins can access every request; a regular user only their own.
function accessFilter(user: CurrentUser): Prisma.OwnershipRequestWhereInput {
  return user.role === Role.Admin ? {} : { userId: user.id };
}

// Only regular users create requests (enforced by requireRole in the routes)
export async function create(user: CurrentUser, input: CreateOwnershipRequestInput) {
  // 1. The lost report must be the user's own and still open
  const report = await prisma.lostReport.findFirst({ where: { id: input.lostReportId, userId: user.id } });
  if (!report) throw notFound('Lost report');
  if (report.status !== LostReportStatus.Open) throw conflict('This lost report is already closed');

  // 2. The found item must still be available
  const item = await prisma.foundItem.findUnique({ where: { id: input.foundItemId } });
  if (!item) throw notFound('Found item');
  if (item.status !== FoundItemStatus.Available) throw conflict('This item is no longer available');

  // 3. Only one pending request per user per item
  const pending = await prisma.ownershipRequest.findFirst({
    where: { userId: user.id, foundItemId: input.foundItemId, status: OwnershipRequestStatus.Pending },
  });
  if (pending) throw conflict('You already have a pending request for this item');

  const request = await prisma.ownershipRequest.create({
    data: { ...input, userId: user.id },
    include: ownershipRequestInclude,
  });
  return toOwnershipRequestDto(request, user.role);
}

export async function list(user: CurrentUser, query: OwnershipRequestListQuery) {
  const where: Prisma.OwnershipRequestWhereInput = { ...accessFilter(user), status: query.status };

  const [rows, total] = await prisma.$transaction([
    prisma.ownershipRequest.findMany({
      where,
      include: ownershipRequestInclude,
      orderBy: [{ createdAt: query.order }, { id: query.order }],
      ...toSkipTake(query.page, query.pageSize),
    }),
    prisma.ownershipRequest.count({ where }),
  ]);

  const items = rows.map((row) => toOwnershipRequestDto(row, user.role));
  return paginated(items, total, query.page, query.pageSize);
}

export async function getById(user: CurrentUser, id: number) {
  const request = await prisma.ownershipRequest.findFirst({
    where: { id, ...accessFilter(user) },
    include: ownershipRequestInclude,
  });
  if (!request) throw notFound('Ownership request');
  return toOwnershipRequestDto(request, user.role);
}

// ----- Admin only (enforced by requireRole in the routes) -----

export async function approve(admin: CurrentUser, id: number) {
  // Everything happens in one transaction: either all changes are saved, or none.
  const approved = await prisma.$transaction(async (tx) => {
    const request = await tx.ownershipRequest.findUnique({ where: { id }, include: ownershipRequestInclude });
    if (!request) throw notFound('Ownership request');
    if (request.status !== OwnershipRequestStatus.Pending) throw conflict('Only pending requests can be approved');
    if (request.foundItem.status !== FoundItemStatus.Available) throw conflict('This item is no longer available');
    if (request.lostReport.status !== LostReportStatus.Open) throw conflict('This lost report is already closed');

    const now = new Date();

    // 1. The request is approved
    await tx.ownershipRequest.update({
      where: { id },
      data: { status: OwnershipRequestStatus.Approved, reviewedAt: now },
    });
    // 2. The found item is returned
    await tx.foundItem.update({ where: { id: request.foundItemId }, data: { status: FoundItemStatus.Returned } });
    // 3. The lost report is returned
    await tx.lostReport.update({ where: { id: request.lostReportId }, data: { status: LostReportStatus.Returned } });
    // 4. Every other pending request for the same item is rejected
    await tx.ownershipRequest.updateMany({
      where: { foundItemId: request.foundItemId, status: OwnershipRequestStatus.Pending, id: { not: id } },
      data: { status: OwnershipRequestStatus.Rejected, rejectionReason: AUTO_REJECT_REASON, reviewedAt: now },
    });

    return tx.ownershipRequest.findUniqueOrThrow({ where: { id }, include: ownershipRequestInclude });
  });

  return toOwnershipRequestDto(approved, admin.role);
}

export async function reject(admin: CurrentUser, id: number, rejectionReason: string) {
  const request = await prisma.ownershipRequest.findUnique({ where: { id } });
  if (!request) throw notFound('Ownership request');
  if (request.status !== OwnershipRequestStatus.Pending) throw conflict('Only pending requests can be rejected');

  const rejected = await prisma.ownershipRequest.update({
    where: { id },
    data: { status: OwnershipRequestStatus.Rejected, rejectionReason, reviewedAt: new Date() },
    include: ownershipRequestInclude,
  });
  return toOwnershipRequestDto(rejected, admin.role);
}
