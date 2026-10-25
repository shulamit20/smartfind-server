import { z } from 'zod';
import { FoundItemStatus } from '../../config/constants';
import { paginationQuery, paginatedSchema } from '../../lib/pagination';
import { dateInput, lookupRefSchema, positiveId, requiredText } from '../../lib/validation';

// ---------- Requests ----------

// Used for both create (POST) and update (PUT). `status` is not here on purpose:
// it only changes through the ownership-request workflow.
export const foundItemBody = z.strictObject({
  title: requiredText(200).meta({ example: 'Black backpack' }),
  description: requiredText(2000).meta({ example: 'Black backpack found near the library entrance' }),
  categoryId: positiveId,
  colorId: positiveId,
  locationId: positiveId,
  foundDate: dateInput,
  verificationQuestion: requiredText(500).meta({ example: 'What color is the sticker on the bag?' }),
  verificationAnswer: requiredText(500).meta({ example: 'Yellow' }),
});

export const FOUND_ITEM_SORT_FIELDS = ['createdAt', 'foundDate'] as const;

export const foundItemListQuery = z.strictObject({
  search: z.string().trim().max(200).optional().meta({ description: 'Searches title and description' }),
  categoryId: positiveId.optional(),
  colorId: positiveId.optional(),
  locationId: positiveId.optional(),
  status: z.enum(FoundItemStatus).optional().meta({
    description: 'Admin only. Regular users always get Available items only.',
  }),
  sortBy: z.enum(FOUND_ITEM_SORT_FIELDS).default('createdAt'),
  ...paginationQuery,
});

export type FoundItemInput = z.infer<typeof foundItemBody>;
export type FoundItemListQuery = z.infer<typeof foundItemListQuery>;

// ---------- Responses (used by the API docs) ----------

export const publicFoundItemSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    category: lookupRefSchema,
    color: lookupRefSchema,
    location: lookupRefSchema,
    foundDate: z.iso.datetime(),
    verificationQuestion: z.string(),
    status: z.enum(FoundItemStatus),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'FoundItem', description: 'What regular users see (no verificationAnswer)' });

export const adminFoundItemSchema = publicFoundItemSchema
  .extend({ verificationAnswer: z.string() })
  .meta({ id: 'FoundItemAdmin', description: 'What admins see' });

export const foundItemPageSchema = paginatedSchema(publicFoundItemSchema).meta({ id: 'FoundItemPage' });
