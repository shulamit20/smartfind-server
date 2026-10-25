import { z } from 'zod';
import { lookupRefSchema, requiredText } from '../../lib/validation';

export const LOOKUP_TYPES = ['categories', 'colors', 'locations'] as const;
export type LookupType = (typeof LOOKUP_TYPES)[number];

// ---------- Requests ----------

export const lookupTypeParams = z.strictObject({
  type: z.enum(LOOKUP_TYPES),
});

export const lookupItemParams = z.strictObject({
  type: z.enum(LOOKUP_TYPES),
  id: z.coerce.number().int().positive(),
});

export const createLookupBody = z.strictObject({
  name: requiredText(50).meta({ example: 'Umbrellas' }),
});

// ---------- Responses (used by the API docs) ----------

export const lookupSchema = lookupRefSchema.meta({ id: 'Lookup' });

export const allLookupsSchema = z
  .object({
    categories: z.array(lookupSchema),
    colors: z.array(lookupSchema),
    locations: z.array(lookupSchema),
  })
  .meta({ id: 'Lookups' });
