// Status and role values are defined once, in prisma/schema.prisma.
// They are re-exported here so the whole app imports them from one place.
export { Role, LostReportStatus, FoundItemStatus, OwnershipRequestStatus } from '@prisma/client';

export const AUTO_REJECT_REASON = 'This item was returned to another person.';

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_REJECTION_REASON_LENGTH = 5;

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 10,
  maxPageSize: 100,
};
