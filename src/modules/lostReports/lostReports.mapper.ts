import { Category, Color, LostReport, Location, User } from '@prisma/client';
import { toLookupDto } from '../lookups/lookups.mapper';

type LostReportWithRelations = LostReport & { category: Category; color: Color; location: Location; user: User };

// Prisma `include` that loads everything the mapper needs
export const lostReportInclude = { category: true, color: true, location: true, user: true } as const;

export function toLostReportDto(report: LostReportWithRelations) {
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    category: toLookupDto(report.category),
    color: toLookupDto(report.color),
    location: toLookupDto(report.location),
    lostDate: report.lostDate,
    status: report.status,
    createdAt: report.createdAt,
    // Only the owner's id and name – never the whole user row
    owner: { id: report.user.id, fullName: report.user.fullName },
  };
}
