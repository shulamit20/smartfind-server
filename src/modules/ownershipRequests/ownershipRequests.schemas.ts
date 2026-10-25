import { z } from 'zod';
import { FoundItemStatus, LostReportStatus, MIN_REJECTION_REASON_LENGTH, OwnershipRequestStatus } from '../../config/constants';
import { paginationQuery, paginatedSchema } from '../../lib/pagination';
import { positiveId, requiredText } from '../../lib/validation';

// ---------- Requests ----------

export const createOwnershipRequestBody = z.strictObject({
  lostReportId: positiveId,
  foundItemId: positiveId,
  answer: requiredText(500).meta({ example: 'Yellow' }),
});

export const ownershipRequestListQuery = z.strictObject({
  status: z.enum(OwnershipRequestStatus).optional(),
  ...paginationQuery,
});

export const rejectBody = z.strictObject({
  rejectionReason: z
    .string()
    .trim()
    .min(MIN_REJECTION_REASON_LENGTH)
    .max(1000)
    .meta({ example: 'The answer does not match the item.' }),
});

export type CreateOwnershipRequestInput = z.infer<typeof createOwnershipRequestBody>;
export type OwnershipRequestListQuery = z.infer<typeof ownershipRequestListQuery>;

// ---------- Responses (used by the API docs) ----------

export const ownershipRequestSchema = z
  .object({
    id: z.number().int(),
    status: z.enum(OwnershipRequestStatus),
    verificationQuestion: z.string(),
    answer: z.string().meta({ description: "The user's answer" }),
    rejectionReason: z.string().nullable(),
    reviewedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    lostReport: z.object({ id: z.number().int(), title: z.string(), status: z.enum(LostReportStatus) }),
    foundItem: z.object({ id: z.number().int(), title: z.string(), status: z.enum(FoundItemStatus) }),
  })
  .meta({ id: 'OwnershipRequest', description: 'What the requesting user sees' });

export const adminOwnershipRequestSchema = ownershipRequestSchema
  .extend({
    correctAnswer: z.string().meta({ description: 'The hidden verification answer – admins only' }),
    user: z.object({ id: z.number().int(), fullName: z.string(), email: z.string() }),
  })
  .meta({ id: 'OwnershipRequestAdmin', description: 'What admins see' });

export const ownershipRequestPageSchema = paginatedSchema(ownershipRequestSchema).meta({ id: 'OwnershipRequestPage' });
