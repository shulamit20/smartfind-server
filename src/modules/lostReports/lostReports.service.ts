import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { conflict, notFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import { FoundItemStatus, LostReportStatus, Role } from '../../config/constants';
import { CurrentUser } from '../../types/currentUser';
import { lookupInclude } from '../lookups/lookups.mapper';
import { assertLookupsExist } from '../lookups/lookups.service';
import { toPublicFoundItem } from '../foundItems/foundItems.mapper';
import { lostReportInclude, toLostReportDto } from './lostReports.mapper';
import { LostReportInput, LostReportListQuery } from './lostReports.schemas';
import { findMatches } from './matching';

// Admins can access every report; a regular user only their own.
function accessFilter(user: CurrentUser): Prisma.LostReportWhereInput {
  return user.role === Role.Admin ? {} : { userId: user.id };
}

// Loads a report the user is allowed to see. Someone else's report -> 404 (not 403),
// so we don't reveal that it exists.
async function findAccessible(user: CurrentUser, id: number) {
  const report = await prisma.lostReport.findFirst({
    where: { id, ...accessFilter(user) },
    include: lostReportInclude,
  });
  if (!report) throw notFound('Lost report');
  return report;
}

function assertOpen(status: LostReportStatus) {
  if (status !== LostReportStatus.Open) {
    throw conflict('Only open reports can be changed');
  }
}

export async function list(user: CurrentUser, query: LostReportListQuery) {
  const where: Prisma.LostReportWhereInput = { ...accessFilter(user), status: query.status };

  const [rows, total] = await prisma.$transaction([
    prisma.lostReport.findMany({
      where,
      include: lostReportInclude,
      orderBy: [{ [query.sortBy]: query.order }, { id: query.order }],
      ...toSkipTake(query.page, query.pageSize),
    }),
    prisma.lostReport.count({ where }),
  ]);

  return paginated(rows.map(toLostReportDto), total, query.page, query.pageSize);
}

export async function getById(user: CurrentUser, id: number) {
  return toLostReportDto(await findAccessible(user, id));
}

// Only regular users create reports (enforced by requireRole in the routes)
export async function create(user: CurrentUser, input: LostReportInput) {
  await assertLookupsExist(input);
  const report = await prisma.lostReport.create({
    data: { ...input, userId: user.id },
    include: lostReportInclude,
  });
  return toLostReportDto(report);
}

export async function update(user: CurrentUser, id: number, input: LostReportInput) {
  const existing = await findAccessible(user, id);
  assertOpen(existing.status);
  await assertLookupsExist(input);

  const report = await prisma.lostReport.update({ where: { id }, data: input, include: lostReportInclude });
  return toLostReportDto(report);
}

export async function remove(user: CurrentUser, id: number) {
  const existing = await findAccessible(user, id);
  assertOpen(existing.status);

  // Delete the report together with all its ownership requests (pending and rejected)
  await prisma.$transaction([
    prisma.ownershipRequest.deleteMany({ where: { lostReportId: id } }),
    prisma.lostReport.delete({ where: { id } }),
  ]);
}

// Possible matches for a report – calculated on request, not stored
export async function getMatches(user: CurrentUser, id: number) {
  const report = await findAccessible(user, id);
  if (report.status === LostReportStatus.Returned) return [];

  const availableItems = await prisma.foundItem.findMany({
    where: { status: FoundItemStatus.Available },
    include: lookupInclude,
  });

  return findMatches(report, availableItems).map((match) => ({
    foundItem: toPublicFoundItem(match.item), // public fields only, also for admins
    score: match.score,
    breakdown: match.breakdown,
  }));
}
