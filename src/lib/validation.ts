import { z } from 'zod';

// Small reusable zod pieces. Objects are "strict": unknown fields -> 400.

export const idParams = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const requiredText = (max = 2000) => z.string().trim().min(1).max(max);

// Accepts "2026-10-01" or a full ISO date-time and turns it into a Date
export const dateInput = z.coerce.date().meta({ type: 'string', format: 'date', example: '2026-10-01' });

export const positiveId = z.coerce.number().int().positive();

// A lookup value as returned inside other objects: { id, name }
export const lookupRefSchema = z.object({ id: z.number().int(), name: z.string() });
