import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, Role } from '../../config/constants';
import { requiredText } from '../../lib/validation';

// ---------- Requests ----------

export const registerBody = z.strictObject({
  fullName: requiredText(100).meta({ example: 'Dana Cohen' }),
  email: z.email().max(200).meta({ example: 'dana@example.com' }),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(100).meta({ example: 'Password123' }),
  // Allowed but ignored: registration ALWAYS creates a regular User
  role: z.unknown().optional().meta({ description: 'Ignored – registration always creates a regular User' }),
});

export const loginBody = z.strictObject({
  email: z.string().trim().min(1).meta({ example: 'dana@example.com' }),
  password: z.string().min(1).meta({ example: 'Password123' }),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;

// ---------- Responses (used by the API docs) ----------

export const userSchema = z
  .object({
    id: z.number().int(),
    fullName: z.string(),
    email: z.string(),
    role: z.enum(Role),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

export const authResponseSchema = z
  .object({
    token: z.string(),
    user: userSchema,
  })
  .meta({ id: 'AuthResponse' });
