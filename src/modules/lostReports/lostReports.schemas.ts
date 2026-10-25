import { z } from 'zod';
import { LostReportStatus } from '../../config/constants';
import { matchingConfig } from '../../config/matching';
import { paginationQuery, paginatedSchema } from '../../lib/pagination';
import { dateInput, lookupRefSchema, positiveId, requiredText } from '../../lib/validation';
import { publicFoundItemSchema } from '../foundItems/foundItems.schemas';

// ---------- Requests ----------

// Used for both create (POST) and update (PUT). No `status` – it only changes through the workflow.
export const lostReportBody = z.strictObject({
  title: requiredText(200).meta({ example: 'Lost black backpack' }),
  description: requiredText(2000).meta({ example: 'Black backpack with a yellow sticker and a laptop inside' }),
  categoryId: positiveId,
  colorId: positiveId,
  locationId: positiveId,
  lostDate: dateInput,
});

export const LOST_REPORT_SORT_FIELDS = ['createdAt', 'lostDate'] as const;

export const lostReportListQuery = z.strictObject({
  status: z.enum(LostReportStatus).optional(),
  sortBy: z.enum(LOST_REPORT_SORT_FIELDS).default('createdAt'),
  ...paginationQuery,
});

export type LostReportInput = z.infer<typeof lostReportBody>;
export type LostReportListQuery = z.infer<typeof lostReportListQuery>;

// ---------- Responses (used by the API docs) ----------

export const lostReportSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    category: lookupRefSchema,
    color: lookupRefSchema,
    location: lookupRefSchema,
    lostDate: z.iso.datetime(),
    status: z.enum(LostReportStatus),
    createdAt: z.iso.datetime(),
    owner: z.object({ id: z.number().int(), fullName: z.string() }),
  })
  .meta({ id: 'LostReport' });

export const lostReportPageSchema = paginatedSchema(lostReportSchema).meta({ id: 'LostReportPage' });

const criteriaNames = Object.keys(matchingConfig.weights);
export const matchSchema = z
  .object({
    foundItem: publicFoundItemSchema,
    score: z.number().int().meta({ example: 80 }),
    breakdown: z
      .record(z.string(), z.boolean())
      .meta({ description: `true/false per criterion: ${criteriaNames.join(', ')}`, example: { category: true, color: true, location: true } }),
  })
  .meta({ id: 'Match' });
